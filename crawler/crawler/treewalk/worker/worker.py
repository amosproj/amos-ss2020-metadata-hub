"""Implementation of the worker process.

The worker process is implemented as a process instead of a thread because
of the Python GIL that prevents threads from parallel execution.
Running the exiftool and hashing files is a CPU-bounded task, thus processes
are required for speeding up the execution time.
"""

# Python imports
import json
import time
import os
import queue
import hashlib
import logging
import subprocess
import multiprocessing
from typing import List, Tuple, Dict
from datetime import datetime


# Local imports
from . import utils
from crawler.services.config import Config
import crawler.communication as communication


class Worker(multiprocessing.Process):

    FINISH_TIMEOUT = 0.1

    def __init__(
        self,
        # TreeWalk auxiliary data
        config: Config,
        identifier: int,
        tree_walk_id: int,
        measure_time: bool,
        # Communication data
        lock: multiprocessing.Lock,
        counter: multiprocessing.Value,
        num_workers: multiprocessing.Value,
        work_packages_done: multiprocessing.Value,
        input_data_queue: multiprocessing.Queue,
        input_command_queue: multiprocessing.Queue,
        db_thread_input_queue_data: multiprocessing.Queue,
        event_self: multiprocessing.Event,
        event_manager: multiprocessing.Event
    ):
        super(Worker, self).__init__()
        # TreeWalk auxiliary data
        self._exec_time = 0
        self._shutdown = False
        self._tw_config = config
        self._identifier = identifier
        self._tree_walk_id = tree_walk_id
        self._measure_time = measure_time
        self._exiftool = self._tw_config.get_exiftool_executable()
        # Communication data
        self._lock = lock
        self._counter = counter
        self._num_workers = num_workers
        self._work_packages_done = work_packages_done
        self._input_data_queue = input_data_queue
        self._input_command_queue = input_command_queue
        self._db_thread_input_queue_data = db_thread_input_queue_data
        self._event_self = event_self
        self._event_manager = event_manager
        # Callback functions for commands
        self._functions = {
            communication.WORKER_STOP: self.worker_stop,
            communication.WORKER_PAUSE: self.worker_pause,
        }


    def increase_work_done(self) -> None:
        """Increase the number of done work packages."""
        with self._lock:
            self._work_packages_done.value += 1


    def msg(self, message: str):
        print(f'Worker {self._identifier}: {message}')


    def log_time(self) -> None:
        """Log the execution times before exiting."""
        if not self._measure_time:
            return
        print(f'Worker {self._identifier} spent {self._exec_time:.2f}s executing.')


    def worker_clean_up(self) -> None:
        """Clean up method for cleaning up all used resources."""
        self._shutdown = True
        with self._lock:
            self._counter.value += 1
            if self._counter.value == self._num_workers.value:
                command = communication.Command(
                    command=communication.DATABASE_THREAD_FINISH,
                    data=None
                )
                self._db_thread_input_queue_data.put(command)


    def worker_stop(self) -> None:
        """Stop the worker.

        Clear queues the worker is responsible of, otherwise the process will
        end up in a deadlock.
        """
        self._shutdown = True
        self._event_self.set()


    def worker_pause(self) -> None:
        """TWManager should only call stop/continue here."""
        self._event_self.set()
        command = self._input_command_queue.get(block=True) # type: communication.Command
        if command.command == communication.WORKER_STOP:
            self.worker_stop()
        # Otherwise, the command is unpause, so it's okay to just return here


    def run(self) -> None:
        """Run the worker process."""
        while True:
            if self._shutdown:
                break
            try:
                command = self._input_command_queue.get(block=False)
            except queue.Empty:
                try:
                    self._do_work()
                except:
                    pass
                continue
            self._functions[command.command]()
        self.msg('About to exit. Waiting for manager.')
        # in case the worker exited and stop is called
        self._event_self.set()
        self._event_manager.wait()
        self.msg('Manager acknowledged exiting.')
        self._event_manager.clear()
        self._event_self.clear()
        self._db_thread_input_queue_data.cancel_join_thread()


    def run_exiftool(self, package: List[str]) -> dict:
        """Run the ExifTool on the package.

        Args:
            package (List[str]): work package

        Returns:
            dict: metadata output or None on error

        """
        try:
            process = subprocess.Popen(
                [f'{self._exiftool}', '-n', '-json', *package],
                stdout=subprocess.PIPE
            )
            # FIXME better solution?
            output = str(process.stdout.read(), 'utf-8')
            if output:
                metadata = json.loads(output)
            else:
                return None
        except:
            return None
        return metadata

    def _do_work(self) -> None:
        """Process the work package.

        A work package can either consist of whole directories that are
        entirely processed or a list of filepaths of a directory that is
        evenly split across the worker processes.

        """


        try:
            package = self._input_data_queue.get(block=False) # type: List[str]
        except queue.Empty:
            self.worker_clean_up()
            return
        # FIXME: If the package is already empty - do we still need this?
        if not package:
            self.increase_work_done()
            return
        # Run the exiftool
        metadata = self.run_exiftool(package)
        if metadata is None:
            # TODO: Error logging
            self.increase_work_done()
            return


        # Create inserts
        inserts = []
        tag_values = []
        for result in metadata:
            # get the exif output for file x
            insert_values = utils.create_insert(self._tree_walk_id, result)
            # Check if result is valid
            if insert_values[0] == 0:
                # FIXME
                # self._logger.warning('Can\'t insert element into database because validity check failed.')
                continue
            # compute the hash256 and add it to the values string
            with open(f"{result['Directory']}/{result['FileName']}".replace("\'\'", "\'"), "rb") as file:
                bytes = file.read()
                hash256 = hashlib.sha256(bytes).hexdigest()
                insert_values += (hash256, False)
            # add the value string to the rest for insert batching
            # FIXME Better solution for ignoring files with no file_type?
            if insert_values[3] == 'NULL':
                continue
            inserts.append(insert_values)

        # Assign the database work to the dedicated thread.
        command = communication.Command(
            command=communication.DATABASE_THREAD_WORK, data=inserts
        )
        self._db_thread_input_queue_data.put(command)
        self.increase_work_done()


import {Page} from "../../Page";
import {ResultPresenter} from "../../buisnesslogic/ResultPresenter";
import {MetadataAutocompletion} from "./autocompletion/MetadataAutocompletion";
import {InputFieldMultiplier} from "../../buisnesslogic/InputFieldMultiplier";
import {GraphQlIntrospectionModel} from "./Modals/GraphQlIntrospectionModel";

export class FormQueryEditor extends Page {
    constructor(parent, identifier, mountpoint, titleSelector) {
        super(parent, identifier, mountpoint, titleSelector);
        this.title = "Form Query Editor";
        this.cacheLevel = 3;
        this.graphQlFetcher = this.parent.dependencies.graphQlFetcher;
        this.resultPresenter = new ResultPresenter(this.graphQlFetcher);
        this.filterFirstElement = this.getFilterElement();
        this.graphQLIntrospectionModal = new GraphQlIntrospectionModel()

        this.metadatAutocompletion = new MetadataAutocompletion(
            this.parent.dependencies.restApiFetcherServer,
            this.graphQlFetcher,
            ".filetype-element-input",
            ".fg-metadata-attribute",
            ".attribut-element-input",
            ".modalOpenerSelector",
            ".modalClearCache"
        );

        this.inputMultiplierFiletypeFilter = this.inputMultiplierFiletypeFilterBuilder();
        this.inputMultiplierAdvancedFilterRows = this.inputMultiplierAdvancedFilterRowsBuilder();
        this.inputMultiplierAttributSelector = this.inputMultiplierAttributSelectorBuilder();

    }


    inputMultiplierFiletypeFilterBuilder() {

        let thisdata = this;
        let emptyFunction = function () {};

        let appendingHtmlCode = `<div class="form-group col-md-4 fg-filetype-element"><input type="text" class="form-control filetype-element-input"></div>`;

        let focusOutFunction = function () {
            thisdata.metadatAutocompletion.updateLists();
        }

        let focusInIfEmptyFieldFunction = function () {
            thisdata.metadatAutocompletion.reAddListener();
        };


        return new InputFieldMultiplier(".fg-filetype-container", ".filetype-element-input", appendingHtmlCode, emptyFunction,
            focusOutFunction, focusInIfEmptyFieldFunction, emptyFunction);

    }


    inputMultiplierAdvancedFilterRowsBuilder() {

        let thisdata = this;
        let emptyFunction = function () {};
        let appendingHtmlCode = this.getFilterElement();

        let focusOutFunction = function (elem) {

            thisdata.reorderFunctionIdsInFilter();
            thisdata.metadatAutocompletion.updateLists();

            //Validate Metadata Datatype:
            // Queries the server to know which kind of datatype the metadatavalue of a given metadata tag has
            console.log("Tag: " + $(elem).val())
            if ($(elem).val().length > 1) {

                let datatype = thisdata.metadatAutocompletion.getDataType($(elem).val());

                console.log("datatype: " + datatype)

                if (datatype == "str") {
                    console.log("datatype str");
                } else if (datatype == "dig") {
                    console.log("dig");
                } else {
                    console.log("no datatype :(")
                }
            }
        }

        let focusInIfEmptyFieldFunction = function () {
            thisdata.reorderFunctionIdsInFilter();
            thisdata.metadatAutocompletion.reAddListener();
        };

        let additionalListenerFunction = function () {
            $(".fg-filter-function").not(".listenerAdded").change(function () {
                if ($(this).val() === "exists") {
                    $(this).parent().parent().find(".fg-metadata-value").hide();
                } else {
                    $(this).parent().parent().find(".fg-metadata-value").show();
                }

            });

            $(".fg-filter-function").not(".listenerAdded").addClass("listenerAdded");
        }


        return new InputFieldMultiplier(".fg-filter-container", ".fg-metadata-attribute", appendingHtmlCode, emptyFunction,
            focusOutFunction, focusInIfEmptyFieldFunction, additionalListenerFunction);

    }

    inputMultiplierAttributSelectorBuilder() {

        let thisdata = this;
        let emptyFunction = function () {};
        let appendingHtmlCode = `<div class="form-group col-md-4 fg-attribut-element"><input type="text" class="form-control attribut-element-input"></div>`;

        let focusOutFunction = function () {
            thisdata.metadatAutocompletion.updateLists();
        }


        let focusInIfEmptyFieldFunction = function () {
            thisdata.metadatAutocompletion.reAddListener();
        };


        return new InputFieldMultiplier(".fg-attribut-container", ".attribut-element-input", appendingHtmlCode, emptyFunction,
            focusOutFunction, focusInIfEmptyFieldFunction, emptyFunction);

    }


    content() {

        // language=HTML
        return `
            <form class="q-send-query-form-editor">


            <!--     for tracking          -->

                <div class="form-row">

                    <div class="form-group col-md-6">
                        <label for="fq-query-Name">Query-Name <a class="pover" title="Query-Name" data-content="The Name, which is saved with the query here into the database to find it later again.">[?]</a></label>
                        <input type="text" class="form-control" id="fq-query-Name" value="searchForFileMetadata">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="fq-owner">Owner <a class="pover" title="Owner" data-content="The Owner, which is saved with the query here into the database.">[?]</a></label>
                        <input type="text" class="form-control" id="fq-owner" value="${localStorage.getItem("username")}" disabled>
                    </div>
                </div>

<!--     date-range-filter           -->

               <div class="form-row">
                    <div class="col-md-12">
                        <hr>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="fq-createFileTimeRangeStart">Start-DateTime (File created)<a class="pover" title="Start-DateTime" data-content="It collects all files, which are older (created-time) than Start-DateTime">[?]</a></label>
                        <input type="datetime-local" class="form-control" id="fq-createFileTimeRangeStart" placeholder="2020-05-22 07:19:29">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="fq-createFileTimeRangeEnd">End-DateTime (File created)<a class="pover" title="End-DateTime" data-content="It collects all files, which are younger (created-time) than End-DateTime">[?]</a></label>
                        <input type="datetime-local" class="form-control" id="fq-createFileTimeRangeEnd" placeholder="2020-07-28 20:35:22">
                    </div>
                </div>



                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="fq-createFileTimeRangeStartUpdated">Start-DateTime (File modified)<a class="pover" title="Start-DateTime" data-content="It collects all files, which are older (modified-time) than Start-DateTime">[?]</a></label>
                        <input type="datetime-local" class="form-control" id="fq-createFileTimeRangeStartUpdated" placeholder="2020-05-22 07:19:29">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="fq-createFileTimeRangeEndUpdated">End-DateTime (File modified)<a class="pover" title="End-DateTime" data-content="It collects all files, which are younger (modified-time) than End-DateTime">[?]</a></label>
                        <input type="datetime-local" class="form-control" id="fq-createFileTimeRangeEndUpdated" placeholder="2020-07-28 20:35:22">
                    </div>
                </div>
<!--     filetypes filter           -->

               <div class="form-row">
                    <div class="col-md-12">
                        <hr>
                    </div>
                </div>

                <div class="form-row">
                    <div class="col-md-12">Which Filetypes: <a class="pover" title="Which Filetypes" data-content="Here you can specify a prefilter of filetypes. If it is empty means, no filetype-filter here">[?]</a></div>
                </div>


                <div class="fg-filetype-container form-row">

                       ${this.inputMultiplierFiletypeFilter.getFirstElement()}

<!--                    <div class="form-group col-md-4 fg-filetype-element">-->
<!--                        <input type="text" class="form-control filetype-element-input" autocomplete="off">-->
<!--                    </div>-->

                </div>
                <div class="form-row justify-content-md-center">
                    <button type="button" class="btn btn-primary modalOpenerSelector mr-3">Open Metadata-Attribut-Selector</button>
                    <button type="button" class="btn btn-danger modalClearCache mr-3">Clear Autocompletion Cache</button>
                </div>


                <!--     Advanced-Filter           -->


               <div class="form-row">
                    <div class="col-md-12">
                        <hr>
                    </div>
                </div>



                <div class="form-row">
                    <div class="col-md-12">Filter: <a class="pover" title="Filter" data-content="Select a filter option.<br>Specify on which metadataattribut you want to use the filter. In the last Input must insert the value<br>For example: Pattern include FileName dog">[?]</a></div>
                </div>

                <div class="fg-filter-container">
                    ${this.inputMultiplierAdvancedFilterRows.getFirstElement()}
                </div>
                <div>
                <div class="form-row justify-content-md-center">
                    <div class="form-group col-md-2">
                    <label for="fg-filter-connector-options">Filter Connector<a class="pover-filter-connector" style="cursor:pointer; color: #007bff;">[?]</a></label>
                        <select class="custom-select fg-filter-connector-options" id="fg-filter-connector-options">
                                <option value="all-and" selected>ALL AND</option>
                                <option value="all-or">ALL OR</option>
                                <option value="custom-only">Custom Only</option>
                                <option value="custom-and">Custom And</option>
                                <option value="custom-or">Custom OR</option>
                            </select>
                    </div>
                </div>

                 <div class="form-row fq-custom-filter-connector-row-description" style="display:none">
                 <p class="text-left"><b>Filter-Connector-Description:</b>
                   <br><br>You can choose here from 5 different filter-connector options. Each option connects your filter in a different way.
                   <br><b>All AND</b> connects al filter with an AND.
                   <br><b>ALL OR</b> connects all filter with an OR.
                   <br><b>Custom Only</b> connects the filter in that way, you want to connect them. So you can connect some filters with an AND some others with an OR, you can also use brackets to group it. If you want to negate a filter you can use a NOT
                   <br><b>Custom And</b> connects the filter the same way Custum Only does, but appends automatically all not in your custom-input referenced filters with an AND
                   <br><b>Custom Or</b> connects the filter the same way Custum Only does, but appends automatically all not in your custom-input referenced filters with an OR
                   <br>
                   </p>
                </div>

                 <div class="form-row fq-custom-filter-connector-row" style="display:none">
                    <div class="form-group col-md-12">
                        <label for="fq-custom-filter-connector">Custom Filter<a class="pover" title="Custom Filter" data-content="Here you can type in your own bool-expression: Example ((f1 AND f2) OR (f3 AND NOT f0)) AND f5">[?]</a></label>
                        <input type="text" class="form-control" id="fq-custom-filter-connector" value="">
                    </div>
                </div>

                </div>

                 <!--     Attribut-Selector           -->


                <div class="form-row">
                    <div class="col-md-12">
                        <hr>
                    </div>
                </div>

                <div class="form-row">
                    <div class="col-md-12">Which Attributes: <a class="pover" title="Which Attributes" data-content="Here you can limit the result to the specific metadata attributes.<br>If you dont add least one, then you get a result of all">[?]</a></div>
                </div>


                <div class="fg-attribut-container form-row">

                    ${this.inputMultiplierAttributSelector.getFirstElement()}

<!--                    <div class="form-group col-md-4 fg-attribut-element">-->
<!--                        <input type="text" class="form-control attribut-element-input">-->
<!--                    </div>-->
                </div>



                <!--     limit           -->

                 <div class="form-row">
                    <div class="col-md-12">
                        <hr>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group col-md-12">
                        <label for="fq-limit">Limit <a class="pover" title="Limit" data-content="The max output limit.<br>Empty means no limit.">[?]</a></label>
                        <input type="text"  class="form-control" id="fq-limit" value="3">
                    </div>
                </div>

                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" id="fq-showDeleted">
                    <label class="form-check-label" for="fq-showDeleted">
                        Show deleted files
                        <a class="pover" title="Show deleted files" data-content="If checked deleted files that are still in the database are also shown.">[?]</a>
                    </label>
                </div>

                 <div class="form-row">
                    <div class="col-md-12">
                        <hr>
                    </div>
                </div>

                <!--     Controll-Buttons           -->

                <button type="submit" class="btn btn-primary">Send</button>
                <button type="button" class="btn btn-primary open-query">Open Query</button>
                <button type="button" class="btn btn-primary send-to-graphiql">Send to GraphiQL</button>
                <button type="button" class="btn btn-primary clear-all">Clear All</button>
            </form>
            <br>
            <div class="resultView1"></div>


            ${this.graphQLIntrospectionModal.getHtmlCode()}

            ${this.metadatAutocompletion.getSuggestionViewer().getStaticModalHtml()}
            ${this.metadatAutocompletion.getStaticModalHtmlClearCache()}

            `;


    }

    onMount() {

        $(".resultView1").html(this.resultPresenter.getHtml());

        this.inputMultiplierFiletypeFilter.listenerAdd();
        this.inputMultiplierAdvancedFilterRows.listenerAdd();
        this.inputMultiplierAttributSelector.listenerAdd();

        this.inputValidation();
        this.inputSuggestion();
        this.metadatAutocompletion.addListener();

        let thisdata = this;

        $(".q-send-query-form-editor").submit(function (event) {
            event.preventDefault();
            thisdata.resultPresenter.generateResultAndInjectIntoDom(thisdata.buildAndGetGraphQlQuery());

        });

        $(".open-query").click(function () {
            thisdata.graphQLIntrospectionModal.openModalWithContent(thisdata.buildAndGetGraphQlQuery());
        });

        $(".send-to-graphiql").click(function () {

            thisdata.parent.storage.query_inject = thisdata.buildAndGetGraphQlQuery();
            thisdata.parent.storage.openedFromEditor = true;
            $("#nav-element-graphiql-console").trigger("click");

        });


        $(".clear-all").click(function () {
            thisdata.clearCache();
            thisdata.reload();
        });


        $(".fg-filter-connector-options").change(function () {
            if ($(this).val().includes("custom")) {
                thisdata.reorderFunctionIdsInFilter();
                $(".fq-custom-filter-connector-row").stop(true).show(1000);
                // $(".function-name-appender").stop(true).show(1000);
            } else {
                $(".fq-custom-filter-connector-row").stop(true).hide(1000);
                $(".function-name-appender").stop(true).hide(1000);
            }
        });

        $(".pover-filter-connector").click(function () {
            $(".fq-custom-filter-connector-row-description").toggle(1000);
        });

    }


    reorderFunctionIdsInFilter() {
        let countElements = $(".fg-metadata-attribute").length;
        let counter = 0;
        let counter2 = -1;

        let customValue = "" + $("#fq-custom-filter-connector").val();

        $(".fg-metadata-attribute").each(function () {
            counter++;
            counter2++;

            if (counter == countElements) {
                $(this).parent().find(".function-name-appender-value").html("not used right now");
                $(this).parent().find(".function-name-appender").stop(true).hide(1000);
                return;
            }

            //reorder function-Ids:
            let oldValue = $(this).parent().find(".function-name-appender-value").html();
            if (oldValue !== "f" + counter2) {
                // customValue = customValue.replaceAll(oldValue, "XXXX" + counter2);
                customValue = customValue.split(oldValue).join("XXXX" + counter2);
                customValue = customValue.split("f" + counter2).join("MISSING" + counter2);
            }


            $(this).parent().find(".function-name-appender-value").html("f" + counter2);
            if ($(".fg-filter-connector-options").val().includes("custom")) {
                $(this).parent().find(".function-name-appender").stop(true).show(1000);
            }

        });

        counter2 = -1;
        $(".fg-metadata-attribute").each(function () {
            counter2++;
            // customValue = customValue.replaceAll("XXXX" + counter2, "f"+counter2);
            customValue = customValue.split("XXXX" + counter2).join("f" + counter2);
        });
        $("#fq-custom-filter-connector").val(customValue);

    }


    inputValidation() {

        //Validate Date
        $("#fq-createFileTimeRangeStart").focusout(function () {

            let startDateElement = document.getElementById("fq-createFileTimeRangeStart");

            let startDate = $("#fq-createFileTimeRangeStart").val();
            let endDate = $("#fq-createFileTimeRangeEnd").val();

            if (startDate != "" && endDate != "" && startDate > endDate) {
                startDateElement.setCustomValidity('Start Time must be before End Time');
                startDateElement.reportValidity();
            } else {
                startDateElement.setCustomValidity("");
            }
        })

        $("#fq-createFileTimeRangeEnd").focusout(function () {

            let startDateElement = document.getElementById("fq-createFileTimeRangeEnd");

            let startDate = $("#fq-createFileTimeRangeStart").val();
            let endDate = $("#fq-createFileTimeRangeEnd").val();

            if (startDate != "" && endDate != "" && startDate > endDate) {
                startDateElement.setCustomValidity('End Time must be after Start Time');
                startDateElement.reportValidity();
            } else {
                startDateElement.setCustomValidity("");
            }
        })

        $("#fq-createFileTimeRangeStartUpdated").focusout(function () {

            let startDateElement = document.getElementById("fq-createFileTimeRangeStartUpdated");

            let startDate = $("#fq-createFileTimeRangeStartUpdated").val();
            let endDate = $("#fq-createFileTimeRangeEndUpdated").val();

            if (startDate != "" && endDate != "" && startDate > endDate) {
                startDateElement.setCustomValidity('Start Time must be before End Time');
                startDateElement.reportValidity();
            } else {
                startDateElement.setCustomValidity("");
            }
        })

        $("#fq-createFileTimeRangeEndUpdated").focusout(function () {

            let startDateElement = document.getElementById("fq-createFileTimeRangeEndUpdated");

            let startDate = $("#fq-createFileTimeRangeStartUpdated").val();
            let endDate = $("#fq-createFileTimeRangeEndUpdated").val();

            if (startDate != "" && endDate != "" && startDate > endDate) {
                startDateElement.setCustomValidity('End Time must be after Start Time');
                startDateElement.reportValidity();
            } else {
                startDateElement.setCustomValidity("");
            }
        })

        //Limit Limit input to integer
        $("#fq-limit").focusout(function () {
            let tmpLimit = $("#fq-limit").val();
            $("#fq-limit").val(tmpLimit.replace(/[^0-9]/g, ''));
        })

    }

    inputSuggestion() {


        //Set owner to user
        //$("#fq-owner").val(localStorage.getItem("username"))
    }


    buildAndGetGraphQlQuery() {

        // let filepattern = $("#fq-filePattern").val();
        //  let checkbox = $("#fq-includeVsExclude").prop('checked');
        let limit = $("#fq-limit").val();
        let showDeleted = $("#fq-showDeleted").prop('checked');
        let deleted = "";
        let startDate = $("#fq-createFileTimeRangeStart").val();
        let endDate = $("#fq-createFileTimeRangeEnd").val();

        let startDateUpdated = $("#fq-createFileTimeRangeStartUpdated").val();
        let endDateUpdated = $("#fq-createFileTimeRangeEndUpdated").val();

        let filterOption = $(".fg-filter-connector-options").val();
        let filterCustomString = $("#fq-custom-filter-connector").val();


        // if (filepattern !== "") {filepattern = `pattern: "${filepattern}",`;} else {filepattern = "";}
        // if (!checkbox) {checkbox = "option: included,";} else {checkbox = "option: excluded,";}
        if (limit !== "") {limit = `limitFetchingSize: ${limit},\n  `;} else {limit = "";}
        if (showDeleted) {deleted = `showDeleted: true,\n  `;}

        if (startDate !== "") {startDate = `start_creation_time: "${startDate}",\n  `;} else {startDate = "";}
        if (endDate !== "") {endDate = `end_creation_time: "${endDate}",\n  `;} else {endDate = "";}
        if (startDateUpdated !== "") {startDateUpdated = `start_modification_time: "${startDateUpdated}",\n  `;} else {startDateUpdated = "";}
        if (endDateUpdated !== "") {endDateUpdated = `end_modification_time: "${endDateUpdated}",\n  `;} else {endDateUpdated = "";}


        if (filterCustomString !== "" && filterOption.includes("custom")) {filterCustomString = `metadata_filter_logic: "${filterCustomString}",\n  `} else {filterCustomString = "";}

        if (filterOption === "all-and" || filterOption === "custom-and") {
            filterOption = `metadata_filter_logic_options: and,\n  `;
        } else if (filterOption === "all-or" || filterOption === "custom-or") {
            filterOption = `metadata_filter_logic_options: or,\n  `;
        } else {
            filterOption = `metadata_filter_logic_options: only_logic_string,\n  `;
        }


        let attributes = "";
        {
            this.inputMultiplierAttributSelector.each(function(elem){
                attributes += `"${$(elem).val()}", `;
            });


            if (attributes !== "") {
                attributes = `selected_attributes:[${attributes}],\n  `;
            }
        }


        let filetypes = "";
        {
            this.inputMultiplierFiletypeFilter.each(function (elem) {
                filetypes += `"${$(elem).val()}", `;
            });


            if (filetypes !== "") {
                filetypes = `file_types:[${filetypes}],\n  `;
            }
        }


        let options_options = "";
        let options_attributes = "";
        let options_values = "";
        {
            this.inputMultiplierAdvancedFilterRows.each(function (elem) {
                options_attributes += `"${$(elem).val()}", `;
                options_options += `${$(elem).parent().find(".fg-filter-function").val()}, `;
                options_values += `"${$(elem).parent().find(".fg-metadata-value").val()}", `;

            });

            //cause all lists have to have the same size, its ok doing this so
            if (options_attributes !== "") {
                options_options = `metadata_options:[${options_options}],\n  `;
                options_attributes = `metadata_attributes:[${options_attributes}],\n  `;
                options_values = `metadata_values:[${options_values}],\n  `;
            }
        }

//dont change the formatting here, cause this has a direct change to the formatting in the graphql-inspection-window
        let query_header = `
   ${limit}
   ${deleted}
   ${startDate} ${endDate} ${startDateUpdated} ${endDateUpdated}
   ${filetypes}
   ${options_options} ${options_attributes} ${options_values}
   ${filterOption} ${filterCustomString}
   ${attributes}
        `;

        if (query_header.trim() === "") {
            query_header = "";
        } else {
            query_header = `(
            ${query_header}
  )`
        }

        let query = `
query
{
  searchForFileMetadata
  ${query_header}
  {
    id,
    crawl_id,
    dir_path,
    name,
    type,
    creation_time,
    access_time,
    modification_time,
    file_hash,
    deleted,
    metadata
    {
      name,
      value,
    }
  }
}`;
//END dont do a change

        return query;


        // searchForFileMetadata(file_ids: [Int!], crawl_ids: [Int!], dir_path: String, dir_path_option: MetadataOption,
        //     file_name: String, file_name_option: MetadataOption, file_types: [String!], size: Int, size_option: IntOption,
        //     start_creation_time: String, end_creation_time: String, start_access_time: String, end_access_time: String,
        //     start_modification_time: String, end_modification_time: String, file_hashes: [String!],
        //     metadata_attributes: [String!], metadata_values:[String!], metadata_options: [MetadataOption!],
        //     metadata_filter_logic_options: FilterLogicOption, metadata_filter_logic: String,
        //     selected_attributes: [String!], limitFetchingSize: Int, showDeleted: Boolean) : [File]

    }


    getFilterElement() {

        //included, excluded, equal, bigger smaller, exists

        // language=HTML
        return `
            <div class="form-row">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <select class="custom-select fg-filter-function">
                            <option selected value="included">Pattern included</option>
                            <option value="excluded">Pattern excluded</option>
                            <option value="equal">Equal</option>
                            <option value="exists">Exists (Attribute)</option>
                            <option value="bigger">Greather Than</option>
                            <option value="smaller">Lower Than</option>
                        </select>
                        <div class="input-group-text" style="display:none;">
                            <input type="checkbox" checked class="fg-include-exclude">
                        </div>
                    </div>
                    <input type="text" class="form-control fg-metadata-attribute" placeholder="Metadata-Attribute">
                    <input type="text" class="form-control fg-metadata-value" placeholder="Value">
                    <div class="input-group-append function-name-appender" style="display:none;">
                        <span class="input-group-text font-weight-bold function-name-appender-value" style="color:red;">f1</span>
                    </div>
                </div>
            </div>`;
    }


    onUnMount() {

    }

    onRegister() {

    }

    onUnLoad() {

    }

}
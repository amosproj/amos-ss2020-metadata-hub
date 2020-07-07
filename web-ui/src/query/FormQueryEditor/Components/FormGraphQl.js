export class FormGraphQl {


    /**
     * you can set the members with the implicit setter-method
     */
    constructor() {

        this.limit = "";
        this.showDeleted = "";
        this.deleted = "";
        this.startDate = "";
        this.endDate = "";

        this.startDateUpdated = "";
        this.endDateUpdated = "";

        this.filterOption = "";
        this.filterCustomString = "";

        this.attributes = "";

        this.filetypes = "";


        this.options_options = "";
        this.options_attributes = "";
        this.options_values = "";
    }


    generateAndGetGraphQlCode() {

        //dont change the formatting here, cause this has a direct change to the formatting in the graphql-inspection-window
        let query_header = `
   ${this.limit}
   ${this.deleted}
   ${this.startDate} ${this.endDate} ${this.startDateUpdated} ${this.endDateUpdated}
   ${this.filetypes}
   ${this.options_options} ${this.options_attributes} ${this.options_values}
   ${this.filterOption} ${this.filterCustomString}
   ${this.attributes}
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
    }


}
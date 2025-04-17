// const Anvil = require('@anvilco/anvil');
// const fs = require('fs');
import Anvil from '@anvilco/anvil';
import * as fs from 'fs';


class AnvilPdfHandler {
    forgeEid = "";
    
    constructor({forgeEid}) {
        let apiKey = process.env.ANVIL_DEVELOPER_ACCESS_TOKEN;
        this.forgeEid = forgeEid;
        this.anvilClient = new Anvil({ apiKey });
        this.ACCESS_KEY = apiKey;
    }

    async downloadPdf(url, outputFilename) {
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${this.ACCESS_KEY}:`).toString('base64')}`,
                },
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const buffer = await response.arrayBuffer();
            fs.writeFileSync(outputFilename, Buffer.from(buffer));

            console.log(`PDF saved as ${outputFilename}`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    }

    async executeWorkflow(payload) {
        try {
            const response = await this.anvilClient.forgeSubmit({
                variables: {
                    complete: true,
                    forgeEid: this.forgeEid,
                    // forgeEidOrSlug: "combined-document-webform",
                    payload,
                    options: {
                        pdf: {
                          merge: false 
                        }
                    }
                },
            });
            const result = response?.data?.data?.forgeSubmit;
            if(!result?.weldData?.eid){
                console.log("Response", response)
            }
            return result.weldData.eid; //eid            
        } catch (error) {
            console.log('Error generating PDF:', error);
            throw error;
        }
    }
    
    async generateAndSavePdf(payload, fileName) {
        try {
            const eid = await this.executeWorkflow(payload, fileName);
            const downloadUrl = `https://app.useanvil.com/download/${eid}/${fileName}.pdf`;
            console.log("Download URL: ", downloadUrl);
            await this.downloadPdf(downloadUrl, `${fileName}.pdf`);
        } catch (error) {
            console.error('Error in generateAndSavePdf:', error);
        }
    }

    async getWeldData(eid){
        let result = null;
        const response = await this.anvilClient.requestGraphQL({
            query: `
              query WeldDataQuery ($eid: String!) {
                weldData (eid: $eid) {
                  eid
                  isComplete
                  isTest
                  documentGroup {
                    files
                  }
                }
              }
            `,
            variables: { eid },
          });
        if(response.statusCode == 200){
            result = response.data.data.weldData; 
        }
        return result;
    }
}

export default AnvilPdfHandler;
// module.exports = AnvilPdfHandler;
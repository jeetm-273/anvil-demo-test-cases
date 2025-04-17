import { describe, expect, test } from '@jest/globals';
import TestCases from './testCases.js';
import AnvilPdfHandler from './AnvilPdfHandler.js';
import * as dotenv from 'dotenv';
dotenv.config();

let anvil = new AnvilPdfHandler({ forgeEid: process.env.FORGE_EID });

describe('Document Inclusion Tests', () => {
    for (const testCase of TestCases) {
        test(testCase.name, async () => {
            // console.log(`Running Test: ${testCase.name}`);

            let eid = await anvil.executeWorkflow(testCase.variables.payload);
            // console.log(`Generated EID: ${eid}`);

            await new Promise(r => setTimeout(r, 5000));

            let weldData = await anvil.getWeldData(eid);
            let files = weldData.documentGroup?.files;
            console.log(`Files Count: ${files?.length}`);
            if(!files){
                eid = await anvil.executeWorkflow(testCase.variables.payload);
                // console.log(`Generated EID: ${eid}`);
    
                await new Promise(r => setTimeout(r, 5000));
    
                let weldData = await anvil.getWeldData(eid);
                files = weldData.documentGroup?.files;
            }

            let fileNames = files?.map(file => file.filename?.trim());

            // Positive assertions
            for (const fileName of testCase.expectedIncludes) {
                expect(fileNames).toContain(fileName + '.pdf');
            }

            // Negative assertions
            for (const fileName of testCase.expectedExcludes) {
                expect(fileNames).not.toContain(fileName + '.pdf');
            }

            console.log(`✅ Test Passed: ${testCase.name}`);
            await new Promise(r => setTimeout(r, 1000));
        }, 600000); // 10-minute timeout
    }
});

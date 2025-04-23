import { describe, expect, it, jest } from '@jest/globals';
import TestCases from './testCases.js';
import AnvilPdfHandler from '../AnvilPdfHandler.js';
import * as dotenv from 'dotenv';
dotenv.config();

let anvil = new AnvilPdfHandler({ forgeEid: process.env.FORGE_EID });

const generateCombinations = (template) => {
    return Object.entries(template).reduce((acc, [key, vals]) =>
        acc.flatMap(combo => vals.map(val => ({ ...combo, [key]: val })))
        , [{}]);
};

const generatePdfs = async (payload) => {
    let eid = await anvil.executeWorkflow(payload);
    await new Promise(r => setTimeout(r, 5000));
    let weldData = await anvil.getWeldData(eid);
    let files = weldData.documentGroup?.files;

    if (!files || files.length === 0) {
        eid = await anvil.executeWorkflow(payload);
        await new Promise(r => setTimeout(r, 5000));
        weldData = await anvil.getWeldData(eid);
        files = weldData.documentGroup?.files;
    }

    return files?.map(f => f.filename?.trim());
};

const timeout = 600000; // 10 minutes

describe('Document Inclusion Tests', () => {
    for (const testCase of TestCases) {
        describe(testCase.name, () => {

            it('Includes PDF when all conditions are met', async () => {
                const fileNames = await generatePdfs(testCase.correctPayload);
                expect(fileNames).toContain(testCase.pdfName + '.pdf');
            }, timeout);

            const invalids = generateCombinations(testCase.incorrectPayload);

            for (const invalidPayload of invalids) {
                it(`Excludes PDF(s) for invalid payload: ${JSON.stringify(invalidPayload)}`, async () => {
                    const fileNames = await generatePdfs(invalidPayload);
                    console.log("fileNames:", fileNames);
                    expect(fileNames).not.toContain(testCase.pdfName + '.pdf');
                }, timeout);
            }
        });
    }
});

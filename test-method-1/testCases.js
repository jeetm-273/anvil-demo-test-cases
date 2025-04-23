function getDifferenceInYears(dateString) {
    const givenDate = new Date(dateString);
    const currentDate = new Date();
    
    const differenceInYears = (currentDate - givenDate) / (1000 * 60 * 60 * 24 * 365.25);
    return differenceInYears;
}

function roofPayload({risk_state, roof_material, roof_year, cov_c_settlement}) {
    let roof_age_difference = new Date().getFullYear() - roof_year; 
   
    const ageLimits = {
        FL_TX: {
            "AsphaltShingles": [11, 25],
            "LightMetalPanels": [11, 25],
            "BuiltupWithGravel": [11, 25],
            "BuiltUpNoGravel": [11, 25],
            "HurricaneShingles": [15, 25],
            "ClayConcreteTiles": [15, 25],
            "Slate": [25, 40],
            "StandingSeam": [25, 40]
        },
        OTHER: {
            "AsphaltShingles": [15, 25],
            "LightMetalPanels": [15, 25],
            "BuiltupWithGravel": [15, 25],
            "BuiltUpNoGravel": [15, 25],
            "HurricaneShingles": [20, 25],
            "ClayConcreteTiles": [35, 40],
            "Slate": [35, 40],
            "StandingSeam": [35, 40]
        }
    };
    
    const stateKey = (risk_state === "FL" || risk_state === "TX") ? "FL_TX" : "OTHER";
    const limits = ageLimits[stateKey][roof_material];

    if (!limits) return { HO_06_44_04_16: false, HO_04_93_05_11: false, Annex_027_01_25: false };

    const [rcvMax, acvMax] = limits;
    let HO_06_44_04_16 = false;
    let HO_04_93_05_11 = false;
    let Annex_027_01_25 = false;
    
    if (cov_c_settlement === "RCV" && roof_age_difference < rcvMax) {
        HO_06_44_04_16 = true;
    } else if (cov_c_settlement === "ACV" && roof_age_difference >= rcvMax && roof_age_difference <= acvMax) {
        HO_06_44_04_16 = true;
        HO_04_93_05_11 = true;
    } else if (roof_age_difference > acvMax) {
        Annex_027_01_25 = true;
    }
    let resultData = {
        roof_material,
        roof_year,
        HO_06_44_04_16, HO_04_93_05_11, Annex_027_01_25   
    };
    return resultData;
}

function waterDamagePayload({risk_state, last_plumbing_year, last_heating_year, claims, water_damage_limit, water_damage_deductible, AOP_deductible}) {
    const currentYear = new Date().getFullYear();

    let payload = {
        last_plumbing_year,
        last_heating_year,
    };

    if (payload.last_plumbing_year) {
        payload.last_plumbing_year_difference = currentYear - Number(payload.last_plumbing_year);
    }
    if (payload.last_heating_year) {
        payload.last_heating_year_difference = currentYear - Number(payload.last_heating_year);
    }

    let waterObj = claims?.find((e) => e.cause_of_loss === "EscapeOfWater") || {};
    payload.has_water_claim = Object.keys(waterObj).length > 0 
    payload.annex_041_01_25 = (risk_state === "FL") 
        ? water_damage_limit <= 10000 
        : water_damage_limit <= 25000;
    
    if (!payload.annex_041_01_25 && risk_state !== "FL") {
        if (waterObj.value <= 25000 && water_damage_deductible >= 2000 && 
            (water_damage_deductible >= 2000 || AOP_deductible >= 2000)) {
            payload.annex_041_01_25 = true;
        }
    }

    payload.annex_044_01_25 = false;
    if (waterObj.value <= 25000 && water_damage_deductible >= 2000 && 
        (water_damage_deductible >= 2000 || AOP_deductible >= 2000) && risk_state !== "FL") {
        payload.annex_044_01_25 = true;
    }
    
    payload.annex_045_01_25 = (waterObj?.value < 25000 && risk_state === "FL");

    return payload;
}

function theftPayload({claims}) {
    let theftObj = claims?.find((e) => e.cause_of_loss == "Theft");
    if(theftObj){
        return {
            has_theft_claim: true,
            theft_value: theftObj.value,
            theft_claim_date: theftObj.claim_date,
            theft_claim_date_difference: getDifferenceInYears(theftObj.claim_date),
        }
    }
    return {}
}



const TestCases = [
    {
        name: 'Test Case 1 - Annex 037 01 25 Should include & Liability Excluded',
        variables: {
            payload: {
                risk_state: "LA",
            }
        },
        expectedIncludes: ['Annex-037-01-25'],
        expectedExcludes: [
            'NMA-1256',
            'Annex-004-01-25',
            'Annex-005-01-25',
            'Annex-006-01-25',
            'Annex-007-01-25',
            'Annex-008-01-25',
            'Annex-009-01-25',
            'Annex-010-01-25',
            'Annex-011-01-25',
            'Annex-012-01-25',
            'Annex-013-01-25',
            'Annex-014-01-25',
            'Annex-015-01-25',
            'Annex-019-01-25',
            'Annex-046-01-25'
        ]
    },
    {    
        name: 'Test Case 2 - Annex 042 01 25 & LSW 1135B Should include And LMA 9191A Exclude',
        variables: {
            payload: {
                risk_state: "FL",
            }
        },
        expectedIncludes: ['Annex-042-01-25', 'LSW-1135B'],
        expectedExcludes: ['LMA-9191A']
    },
    {
        name: 'Test Case 3 -  LMA-9191A include and Annex 037 01 25, Annex 042 01 25 & LSW-1135B Should not include if risk state is not LA & FL',
        variables: {
            payload: {
                risk_state: "CA",
            }
        },
        expectedIncludes: ['LMA-9191A'],
        expectedExcludes: ['LSW-1135B', 'Annex-037-01-25', 'Annex-042-01-25']
    },
    {
        name: 'Test Case 4 -  Liability included & Additional insured, Fire Alarm, Extended Replacement Excluded',
        variables: {
            payload: {
                cov_e_limit: 1000
            }
        },
        expectedIncludes: [
            'NMA-1256',
            'Annex-004-01-25',
            'Annex-005-01-25',
            'Annex-006-01-25',
            'Annex-007-01-25',
            'Annex-008-01-25',
            'Annex-009-01-25',
            'Annex-010-01-25',
            'Annex-011-01-25',
            'Annex-012-01-25',
            'Annex-013-01-25',
            'Annex-014-01-25',
            'Annex-015-01-25',
            'Annex-019-01-25',
            'Annex-046-01-25'
        ],
        expectedExcludes: ['HO-04-10-10-00', 'HO-04-16-10-00', 'HO-04-20-05-11']
    },
    {
        name: 'Test Case 5 - Additional insured, Fire Alarm & Extended Replacement Included',
        variables: {
            payload: {
                additional_insured: [
                    {
                        "name": {
                          "firstName": "Taylor",
                          "lastName": "Jones"
                        },
                        "address": {
                          "street1": "Calle Liverpool 123",
                          "street2": "Juárez, Cuauhtémoc",
                          "city": "Ciudad de México",
                          "state": "CDMX",
                          "zip": "06600",
                          "country": "mx"
                        }
                      }
                ],
                fire_alarm: 'Yes',
                extended_replacement: 150, // if it is less then 100 then not print
            }
        },
        expectedIncludes: [
            'HO-04-10-10-00',
            'HO-04-16-10-00',
            'HO-04-20-05-11'
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 6 - Mold & ordinance law Excluded',
        variables:{
            payload: {
                mold_limit: 0,
                ordinance_law: 5,
            }
        },
        expectedIncludes: [
            'LMA-5018'
        ],
        expectedExcludes: [
            'HO-04-27-05-11',
            'HO-04-77-10-00'
        ]
    },
    {
        name: 'Test Case 6 - Mold & ordinance law Included',
        variables:{
            payload: {
                mold_limit: 5,
                ordinance_law: 15, // if it is less then 10 then form should not show
            }
        },
        expectedIncludes: [
            'HO-04-27-05-11',
            'HO-04-77-10-00'
        ],
        expectedExcludes: [
           'LMA-5018'
        ]
    },
    {
        name: 'Test Case 8 - Personal Property replacement Excluded',
        variables:{
            payload: {
                cov_c_settlement: 'ACV',
            }
        },
        expectedIncludes: [],
        expectedExcludes: ['HO-04-90-05-11']
    },
    {
        name: 'Test Case 9 - Personal Property replacement Included',
        variables:{
            payload: {
                cov_c_settlement: 'RCV',
            }
        },
        expectedIncludes: [
            'HO-04-90-05-11',
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 10 - ACTUAL CASH VALUE LOSS SETTLEMENT WINDSTORM EXCLUDE',
        variables:{
            payload: {
                ...roofPayload({
                    risk_state: 'FL', roof_material: '', roof_year: '', cov_c_settlement: 'RCV'
                })
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'HO-04-93-05-11',
        ]
    },    
    {
        name: 'Test Case 11 - ACTUAL CASH VALUE LOSS SETTLEMENT WINDSTORM EXCLUDE',
        variables:{
            payload: {
                ...roofPayload({
                    risk_state: 'FL', roof_material: 'AsphaltShingles', roof_year: 2012, cov_c_settlement: 'Excluded'
                })
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'HO-04-93-05-11',
        ]
    },
    {
        name: 'Test Case 12 - ACTUAL CASH VALUE LOSS SETTLEMENT WINDSTORM INCLUDE',
        variables:{
            payload: {
                ...roofPayload({
                    risk_state: 'FL', roof_material: 'AsphaltShingles', roof_year: 2012, cov_c_settlement: 'ACV'
                })
            }
        },
        expectedIncludes: [
            'HO-04-93-05-11',
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 13 - LIMITED WATER BACK-UP AND PERSONAL INJURY COVERAGE EXCLUDE',
        variables:{
            payload: {
                water_backup_limit: 0,
                personal_injury_limit: 0
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'HO-04-95-01-14', 
            'HO-24-82-05-11'
        ]
    },
    {
        name: 'Test Case 14 - LIMITED WATER BACK-UP AND PERSONAL INJURY COVERAGE INCLUDE',
        variables:{
            payload: {
                water_backup_limit: 5, // print when water_backup_limit > 0
                personal_injury_limit: 3 // print when personal_injury_limit > 0
            }
        },
        expectedIncludes: [
            'HO-04-95-01-14',
            'HO-24-82-05-11'
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 15 - SECONDARY SEASONAL HOME ENDORSEMENT EXCLUDE',
        variables:{
            payload: {
                residence_use: 'RentalTenanted', // no print document when residence use is Primary PrimaryAndTenant RentalTenanted
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'Annex-018-01-25',
        ]
    },
    {
        name: 'Test Case 16 - SECONDARY SEASONAL HOME ENDORSEMENT INCLUDE',
        variables:{
            payload: {
                residence_use: 'SecondaryGeneral', // print document when residence use is SecondaryGeneral, SecondarySeasonal SecondaryRental
            }
        },
        expectedIncludes: [
            'Annex-018-01-25',
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 17 - WATER DAMAGE LIMITATION (HO) EXCLUDE',
        variables:{
            payload: {
                ...waterDamagePayload({
                    risk_state: 'NY', 
                    last_plumbing_year: "" + 2025, 
                    last_heating_year: "" + 2020, 
                    claims: [], 
                    water_damage_limit: 500000, // not print because water_damage_limit <= 25000 if state not FL
                    water_damage_deductible: 500000, 
                    AOP_deductible: 500000
                })
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'Annex-041-01-25'
        ]
    },
    {
        name: 'Test Case 18 - WATER DAMAGE LIMITATION (HO) INCLUDE',
        variables:{
            payload: {
                ...waterDamagePayload({
                    risk_state: 'FL', 
                    last_plumbing_year: "" + 2025, 
                    last_heating_year: ""+ 2020, 
                    claims: [], 
                    water_damage_limit: 500, // not print because water_damage_limit <= 25000 if state not FL
                    water_damage_deductible: 50, 
                    AOP_deductible: 50
                })
            }
        },
        expectedIncludes: [
            'Annex-041-01-25',
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 19 - SWIMMING POOL & LIABILITY EXCLUSION EXCLUDE',
        variables:{
            payload: {
                cov_e_limit: 1000,
                has_pool: true,
                is_pool_to_code: true
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'Annex-020-01-25',
            'Annex-048-01-25'
        ]
    },
    {
        name: 'Test Case 20 - SWIMMING POOL & LIABILITY EXCLUSION INCLUDE - 1',
        variables:{
            payload: {
                cov_e_limit: 0
            }
        },
        expectedIncludes: [
            'Annex-020-01-25',
            'Annex-048-01-25'
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 21 - SWIMMING POOL INCLUDE - 2',
        variables:{
            payload: {
                has_pool: true,
                is_pool_to_code: false
            }
        },
        expectedIncludes: [
            'Annex-020-01-25',
        ],
        expectedExcludes: []
    }, 
    {
        name: 'Test Case 22 - THEFT EXCLUSION ENDORSEMENT EXCLUDE',
        variables:{
            payload: {
               ...theftPayload({
                claims: [
                    {
                        cause_of_loss: "Theft",
                        value: 100,
                        claim_date: '01/12/2010' // it should less then 3 years
                    }
                ]
               })
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'Annex-022-01-25',
        ]
    },
    {
        name: 'Test Case 23 - THEFT EXCLUSION ENDORSEMENT INCLUDE',
        variables:{
            payload: {
               ...theftPayload({
                claims: [
                    {
                        cause_of_loss: "Theft",
                        value: 100,
                        claim_date: '01/12/2024' // it should less then 3 years
                    }
                ]
               })
            }
        },
        expectedIncludes: [
            'Annex-022-01-25',
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 24 - PREMISES LIABILITY LIMITATION (HO) EXCLUDE',
        variables:{
            payload: {
                cov_e_limit:  0
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'Annex-043-01-25',
        ]
    },
    {
        name: 'Test Case 24 - PREMISES LIABILITY LIMITATION (HO) INCLUDE',
        variables:{
            payload: {
                cov_e_limit:  100,
                residence_use: 'Rental',
            }
        },
        expectedIncludes: [
            'Annex-043-01-25',
        ],
        expectedExcludes: [
        ]
    },
    {
        name: 'Test Case 26 - WATER DAMAGE DEDUCTIBLE (HO) EXCLUDE',
        variables:{
            payload: {
                risk_state: 'FL',
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'Annex-044-01-25',
        ]
    }, 
    {
        name: 'Test Case 27 - WATER DAMAGE DEDUCTIBLE (HO) INCLUDE',
        variables:{
            payload: {
                ...waterDamagePayload({
                    risk_state: 'NY', 
                    last_plumbing_year: "" + 2025, 
                    last_heating_year: ""+ 2020, 
                    claims: [
                        {
                            cause_of_loss: "EscapeOfWater",
                            value: 2000,
                        }
                    ], 
                    water_damage_limit: 500,
                    water_damage_deductible: 2100, 
                    AOP_deductible: 2100
                })
            }
        },
        expectedIncludes: [
            'Annex-044-01-25',
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 28 - WATER DAMAGE EXCLUSION (HO) EXCLUDE',
        variables:{
            payload: {
                risk_state: 'FL',
                claims: [] // if no claims then not show
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'Annex-045-01-25',
        ]
    },
    {
        name: 'Test Case 29 - WATER DAMAGE EXCLUSION (HO) INCLUDE',
        variables:{
            payload: {
                ...waterDamagePayload({
                    risk_state: 'FL', 
                    last_plumbing_year: "" + 2025, 
                    last_heating_year: ""+ 2020, 
                    claims: [
                        {
                            cause_of_loss: "EscapeOfWater",
                            value: 2000,
                        }
                    ], 
                })
            }
        },
        expectedIncludes: [
            'Annex-045-01-25',
        ],
        expectedExcludes: []
    },
    {
        name: 'Test Case 30 - ROOF EXCLUSION EXCLUDE',
        variables:{
            payload: {
                ...roofPayload({
                    risk_state: 'FL', 
                    roof_material: 'AsphaltShingles', 
                    roof_year: 2005, // it should > 25 
                    cov_c_settlement: 'Exclusion'
                })
            }
        },
        expectedIncludes: [],
        expectedExcludes: [
            'Annex-027-01-25',
        ]
    },
    {
        name: 'Test Case 31 - ROOF EXCLUSION INCLUDE',
        variables:{
            payload: {
                ...roofPayload({
                    risk_state: 'FL', 
                    roof_material: 'AsphaltShingles', 
                    roof_year: 1995, // it should > 25 
                    cov_c_settlement: 'Exclusion'
                })
            }
        },
        expectedIncludes: [
            'Annex-027-01-25',
        ],
        expectedExcludes: []
    },
];

export default TestCases;
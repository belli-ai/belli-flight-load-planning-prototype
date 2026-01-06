/**
 * Static Data Store
 *
 * Contains all seed data for use when NEXT_PUBLIC_USE_STATIC_DATA=true.
 * This allows the application to run without a database connection.
 */

// ============================================================================
// STATIC IDs - For consistent references
// ============================================================================

export const LOCATION_IDS = {
  KUL: "d1b68932-ef43-4140-93bf-78acd9e5f3b4",
  SIN: "e00a0a9b-c033-48de-88f1-cf084e7e606a",
  HKG: "c07c2c47-b602-495e-bf8c-159c08b061e6",
  DXB: "6b393177-d13f-4908-9df2-1bbe91011e2a",
  LHR: "5a23c79d-c422-4434-84f1-217cddc038e5",
  FRA: "94180f04-6908-4b55-bf27-ddf6f0554639",
  AMS: "fd99fe97-c5d8-4eee-af46-28306c64424b",
  CDG: "d15ca0dc-9b0a-451b-b108-c6d47aaeb1e7",
  NRT: "bd8e5cc0-f44f-49da-9f33-553876baf6d1",
  ICN: "bb3c712d-df83-41a9-acc8-13575f50ca73",
} as const;

export const DG_CLASS_IDS = {
  CLASS_1: "7b65498f-b836-4c59-8084-0474e6ec261a",
  CLASS_1_4S: "8586c0e0-e45b-4d8d-bd28-d8ecb8f45579",
  CLASS_2_1: "c55b7112-8c60-4aa8-90ff-c9a3360c8855",
  CLASS_2_2: "121a1adc-2945-4718-86ac-41d3da5ef9cd",
  CLASS_2_3: "fdbf128f-936e-4d5a-ab27-90b170e89908",
  CLASS_3: "debfe42f-fa67-4e03-81a4-37ba070c3b34",
  CLASS_4_1: "f58b195e-5761-4469-a782-183981434832",
  CLASS_4_2: "ddad3bca-2f42-4745-a98f-8252d50a0961",
  CLASS_4_3: "b66d42a7-20b7-4c83-b665-51f241c249b3",
  CLASS_5_1: "c42ce7b1-bd26-4202-9991-c0498dbc5ca1",
  CLASS_5_2: "bb9b07c7-d67e-469a-9c4c-90a734be200a",
  CLASS_6_1: "1903f72b-2331-4442-9d7f-93b663f92966",
  CLASS_6_2: "b110a3c6-29bf-4519-8369-983ad9608e2d",
  CLASS_7: "69b51d25-18a5-41e6-a221-4a616e16658c",
  CLASS_8: "a993eddb-d8d8-4bc4-a884-940b56197a12",
  CLASS_9: "1532c95f-762e-42ea-ae70-3760e009ab35",
} as const;

export const TEMP_ZONE_IDS = {
  DEEP_FROZEN: "607ffcba-af0b-487a-ad84-d943992c0311",
  FROZEN: "3cffa013-3cb2-4ff0-a8d8-53d4a061d8b6",
  CHILLED: "8b920cea-edbc-4775-8b90-c9f9a8396295",
  COOL: "5c345928-3f2c-4135-8b45-967bcfad3988",
  AMBIENT: "1c6868a7-3ee8-44fc-8390-f20a531c9747",
} as const;

export const ULD_TYPE_IDS = {
  AKE: "fd5066d2-7ec5-4e41-bfb6-aafca0dda7f2",
  AKH: "1eb33aa8-28cc-4258-984a-c6ccf3c1e289",
  PKC: "215af6d7-27cb-4af6-9863-1b849ca4a742",
  PKX: "71d44cbb-4569-4868-9502-7f399a64def4",
  FQA: "6c8ff757-d373-4413-982d-cc0cf6c4590a",
  PEB: "d25c658c-fa3f-4121-8b4d-480aaf2ce7f4",
  DQF: "2a184ef9-52da-4f91-930d-9854006993c7",
  PMC: "625e403e-5cdb-4e78-a7b5-98bfaa1f6147",
  PAG: "54427e2c-0863-49cd-a395-ef0e203c82ef",
  PAJ: "81f2f943-dd2e-4276-898c-aa4a6e1d60a7",
  PAH: "91b339fb-eefd-4369-8314-8411509d17f2",
  PRA: "86932d1c-c940-44d5-9410-a90235c99785",
  AAX: "e0a959ad-66a2-43e6-a803-443a891937e3",
  AAY: "fbd013ae-baf7-4538-b232-c870c8793b5a",
  AAA: "29137626-6c06-4fae-8b14-b0a57dbb8979",
  AAC: "b7e7ac27-9059-4539-878d-0928a05ed14c",
  AAJ: "97a7c92f-1171-49dd-bb96-17bfa2fb82af",
  LAK: "a178a69f-62ed-44ba-b97a-7b81504263ec",
  LAY: "8ab0f48e-b32b-47a3-ba49-c55eab329ccb",
  RKN: "7a888c64-3fe9-4ff5-a8fd-c7eb3833621f",
  RAP: "12f0e617-d945-4410-bd74-b23e908c43ba",
} as const;

export const AIRCRAFT_IDS = {
  A321_P2F: "b7e7ac27-9059-4539-878d-0928a05ed14c",
} as const;

export const PRESET_IDS = {
  A321_P2F_STANDARD: "f8c9a1b2-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
  A321_P2F_HIGH_DENSITY: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
} as const;

export const DECK_CONFIG_IDS = {
  MAIN_DECK: "97a7c92f-1171-49dd-bb96-17bfa2fb82af",
  LOWER_FWD: "a178a69f-62ed-44ba-b97a-7b81504263ec",
  LOWER_AFT: "8ab0f48e-b32b-47a3-ba49-c55eab329ccb",
  BULK: "7a888c64-3fe9-4ff5-a8fd-c7eb3833621f",
} as const;

export const FLIGHT_IDS = {
  RY501_KUL_SIN: "25cfae82-930b-4338-8d20-4d93ae8fd9d8",
  RY502_KUL_HKG: "c37f4d13-1b3a-4209-8076-08d4906d1f56",
} as const;

// ============================================================================
// STATIC DATA
// ============================================================================

export const staticLocations = [
  { id: LOCATION_IDS.KUL, airportCode: "KUL", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", timezone: "Asia/Kuala_Lumpur" },
  { id: LOCATION_IDS.SIN, airportCode: "SIN", city: "Singapore", country: "Singapore", countryCode: "SG", timezone: "Asia/Singapore" },
  { id: LOCATION_IDS.HKG, airportCode: "HKG", city: "Hong Kong", country: "Hong Kong", countryCode: "HK", timezone: "Asia/Hong_Kong" },
  { id: LOCATION_IDS.DXB, airportCode: "DXB", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai" },
  { id: LOCATION_IDS.LHR, airportCode: "LHR", city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London" },
  { id: LOCATION_IDS.FRA, airportCode: "FRA", city: "Frankfurt", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin" },
  { id: LOCATION_IDS.AMS, airportCode: "AMS", city: "Amsterdam", country: "Netherlands", countryCode: "NL", timezone: "Europe/Amsterdam" },
  { id: LOCATION_IDS.CDG, airportCode: "CDG", city: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris" },
  { id: LOCATION_IDS.NRT, airportCode: "NRT", city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo" },
  { id: LOCATION_IDS.ICN, airportCode: "ICN", city: "Seoul", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul" },
];

export const staticDangerousGoodsClasses = [
  { id: DG_CLASS_IDS.CLASS_1, classCode: "1", division: null, name: "Explosives", description: "Substances and articles which have a mass explosion hazard", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_1_4S, classCode: "1.4S", division: "1.4S", name: "Explosives (Compatible Group S)", description: "Explosives presenting no significant blast hazard", isExemptFromSegregation: true },
  { id: DG_CLASS_IDS.CLASS_2_1, classCode: "2.1", division: "2.1", name: "Flammable Gases", description: "Gases which are flammable", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_2_2, classCode: "2.2", division: "2.2", name: "Non-Flammable, Non-Toxic Gases", description: "Gases which are neither flammable nor toxic", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_2_3, classCode: "2.3", division: "2.3", name: "Toxic Gases", description: "Gases which are toxic", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_3, classCode: "3", division: null, name: "Flammable Liquids", description: "Liquids with a flash point below 60°C", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_4_1, classCode: "4.1", division: "4.1", name: "Flammable Solids", description: "Solids which are readily combustible", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_4_2, classCode: "4.2", division: "4.2", name: "Spontaneously Combustible", description: "Substances liable to spontaneous combustion", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_4_3, classCode: "4.3", division: "4.3", name: "Dangerous When Wet", description: "Substances which emit flammable gases when in contact with water", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_5_1, classCode: "5.1", division: "5.1", name: "Oxidizers", description: "Substances which may cause or contribute to combustion", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_5_2, classCode: "5.2", division: "5.2", name: "Organic Peroxides", description: "Organic compounds containing the bivalent -O-O- structure", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_6_1, classCode: "6.1", division: "6.1", name: "Toxic Substances", description: "Substances liable to cause death or serious injury", isExemptFromSegregation: true },
  { id: DG_CLASS_IDS.CLASS_6_2, classCode: "6.2", division: "6.2", name: "Infectious Substances", description: "Substances containing pathogens", isExemptFromSegregation: true },
  { id: DG_CLASS_IDS.CLASS_7, classCode: "7", division: null, name: "Radioactive Materials", description: "Materials containing radionuclides", isExemptFromSegregation: true },
  { id: DG_CLASS_IDS.CLASS_8, classCode: "8", division: null, name: "Corrosives", description: "Substances which cause destruction of living tissue", isExemptFromSegregation: false },
  { id: DG_CLASS_IDS.CLASS_9, classCode: "9", division: null, name: "Miscellaneous Dangerous Goods", description: "Substances presenting a danger not covered by other classes", isExemptFromSegregation: true },
];

export const staticTemperatureZones = [
  { id: TEMP_ZONE_IDS.DEEP_FROZEN, code: "DEEP_FROZEN", name: "Deep Frozen", minTempCelsius: -80, maxTempCelsius: -18, description: "Ultra-low temperature for biologics, seafood" },
  { id: TEMP_ZONE_IDS.FROZEN, code: "FROZEN", name: "Frozen", minTempCelsius: -25, maxTempCelsius: -18, description: "Standard frozen cargo" },
  { id: TEMP_ZONE_IDS.CHILLED, code: "CHILLED", name: "Chilled/Refrigerated", minTempCelsius: 2, maxTempCelsius: 8, description: "Vaccines, fresh produce, pharmaceuticals" },
  { id: TEMP_ZONE_IDS.COOL, code: "COOL", name: "Cool", minTempCelsius: 8, maxTempCelsius: 15, description: "Temperature-sensitive general cargo" },
  { id: TEMP_ZONE_IDS.AMBIENT, code: "AMBIENT", name: "Ambient/Room Temperature", minTempCelsius: 15, maxTempCelsius: 25, description: "Standard room temperature cargo" },
];

export const staticUldTypes = [
  { id: ULD_TYPE_IDS.AKE, code: "AKE", name: "LD-3 Container", category: "CONTAINER", contour: "HALF_WIDTH", maxGrossWeightKg: 1588, tareWeightKg: 82, maxVolumeM3: 4.0, lengthCm: 156.2, widthCm: 153.4, heightCm: 162.6, internalLengthCm: 147, internalWidthCm: 145, internalHeightCm: 155, doorWidthCm: 147, doorHeightCm: 155, colSpan: 1, isRefrigerated: false, deckCompatibility: ["LOWER"] },
  { id: ULD_TYPE_IDS.AKH, code: "AKH", name: "LD-3 Half-height Container", category: "CONTAINER", contour: "HALF_WIDTH", maxGrossWeightKg: 1588, tareWeightKg: 73, maxVolumeM3: 3.5, lengthCm: 156.2, widthCm: 153.4, heightCm: 114, internalLengthCm: 147, internalWidthCm: 145, internalHeightCm: 105, doorWidthCm: 147, doorHeightCm: 105, colSpan: 1, isRefrigerated: false, deckCompatibility: ["LOWER"] },
  { id: ULD_TYPE_IDS.PKC, code: "PKC", name: "P1 Container", category: "CONTAINER", contour: "FULL_WIDTH", maxGrossWeightKg: 6804, tareWeightKg: 100, maxVolumeM3: 14.0, lengthCm: 317.5, widthCm: 243.8, heightCm: 162.6, internalLengthCm: 305, internalWidthCm: 230, internalHeightCm: 155, doorWidthCm: 230, doorHeightCm: 155, colSpan: 2, isRefrigerated: false, deckCompatibility: ["LOWER"] },
  { id: ULD_TYPE_IDS.PKX, code: "PKX", name: "P1P Container", category: "CONTAINER", contour: "HALF_WIDTH", maxGrossWeightKg: 1588, tareWeightKg: 58, maxVolumeM3: 14.0, lengthCm: 156.2, widthCm: 153.4, heightCm: 162.6, internalLengthCm: 147, internalWidthCm: 145, internalHeightCm: 155, doorWidthCm: 147, doorHeightCm: 155, colSpan: 1, isRefrigerated: false, deckCompatibility: ["LOWER"] },
  { id: ULD_TYPE_IDS.FQA, code: "FQA", name: "LD-4 Container", category: "CONTAINER", contour: "HALF_WIDTH", maxGrossWeightKg: 2450, tareWeightKg: 61, maxVolumeM3: 7.0, lengthCm: 153.4, widthCm: 153.4, heightCm: 162.6, internalLengthCm: 145, internalWidthCm: 145, internalHeightCm: 155, doorWidthCm: 145, doorHeightCm: 155, colSpan: 1, isRefrigerated: false, deckCompatibility: ["LOWER"] },
  { id: ULD_TYPE_IDS.PMC, code: "PMC", name: "PMC Pallet", category: "PALLET", contour: "FULL_WIDTH", maxGrossWeightKg: 5034, tareWeightKg: 120, maxVolumeM3: 11.0, lengthCm: 317.5, widthCm: 243.8, heightCm: 160, internalLengthCm: 317.5, internalWidthCm: 243.8, internalHeightCm: 160, doorWidthCm: null, doorHeightCm: null, colSpan: 2, isRefrigerated: false, deckCompatibility: ["MAIN"] },
  { id: ULD_TYPE_IDS.PAG, code: "PAG", name: "PAG Pallet", category: "PALLET", contour: "FULL_WIDTH", maxGrossWeightKg: 6033, tareWeightKg: 113, maxVolumeM3: 11.0, lengthCm: 317.5, widthCm: 223.5, heightCm: 160, internalLengthCm: 317.5, internalWidthCm: 223.5, internalHeightCm: 160, doorWidthCm: null, doorHeightCm: null, colSpan: 2, isRefrigerated: false, deckCompatibility: ["MAIN"] },
  { id: ULD_TYPE_IDS.PAJ, code: "PAJ", name: "PAJ Pallet with Net", category: "PALLET", contour: "FULL_WIDTH", maxGrossWeightKg: 6033, tareWeightKg: 113, maxVolumeM3: 11.0, lengthCm: 317.5, widthCm: 223.5, heightCm: 160, internalLengthCm: 317.5, internalWidthCm: 223.5, internalHeightCm: 160, doorWidthCm: null, doorHeightCm: null, colSpan: 2, isRefrigerated: false, deckCompatibility: ["MAIN"] },
  { id: ULD_TYPE_IDS.PAH, code: "PAH", name: "PAH Pallet with Net", category: "PALLET", contour: "FULL_WIDTH", maxGrossWeightKg: 6033, tareWeightKg: 113, maxVolumeM3: 14.0, lengthCm: 317.5, widthCm: 243.8, heightCm: 160, internalLengthCm: 317.5, internalWidthCm: 243.8, internalHeightCm: 160, doorWidthCm: null, doorHeightCm: null, colSpan: 2, isRefrigerated: false, deckCompatibility: ["MAIN"] },
  { id: ULD_TYPE_IDS.RKN, code: "RKN", name: "LD-3 Refrigerated Container", category: "CONTAINER", contour: "HALF_WIDTH", maxGrossWeightKg: 1588, tareWeightKg: 150, maxVolumeM3: 3.5, lengthCm: 156.2, widthCm: 153.4, heightCm: 162.6, internalLengthCm: 130, internalWidthCm: 130, internalHeightCm: 140, doorWidthCm: 130, doorHeightCm: 140, colSpan: 1, isRefrigerated: true, deckCompatibility: ["LOWER"] },
  { id: ULD_TYPE_IDS.RAP, code: "RAP", name: "Main Deck Refrigerated Pallet", category: "PALLET", contour: "FULL_WIDTH", maxGrossWeightKg: 4626, tareWeightKg: 280, maxVolumeM3: 8.0, lengthCm: 317.5, widthCm: 223.5, heightCm: 160, internalLengthCm: 290, internalWidthCm: 200, internalHeightCm: 150, doorWidthCm: null, doorHeightCm: null, colSpan: 1, isRefrigerated: true, deckCompatibility: ["MAIN"] },
];

export const staticAircrafts = [
  {
    id: AIRCRAFT_IDS.A321_P2F,
    name: "Airbus A321-211P2F Freighter",
    typeCode: "A321",
    subtype: "211P2F",
    registration: "9M-XXX",
    msn: "1887",
    mainDeckMaxWeightKg: 27500,
    mainDeckMaxVolumeM3: 160,
    lowerDeckMaxWeightKg: 16329,
    lowerDeckMaxVolumeM3: 51,
    totalMaxPayloadKg: 27500,
    totalMaxVolumeM3: 211,
    maxZeroFuelWeightKg: 63000,
    maxTakeoffWeightKg: 77000,
    maxLandingWeightKg: 66800,
    maxTaxiWeightKg: 77400,
    operatingEmptyWeightKg: 48500,
    datumLocation: "NOSE",
    macLeadingEdgeCm: 1500,
    macLengthCm: 420,
  },
];

export const staticDeckConfigurationPresets = [
  { id: PRESET_IDS.A321_P2F_STANDARD, aircraftId: AIRCRAFT_IDS.A321_P2F, presetName: "Standard Configuration", presetCode: "STD", description: "Standard cargo configuration with 14 main deck positions and lower deck containers", isDefault: true },
  { id: PRESET_IDS.A321_P2F_HIGH_DENSITY, aircraftId: AIRCRAFT_IDS.A321_P2F, presetName: "High Density Configuration", presetCode: "HD", description: "High density configuration optimized for smaller containers", isDefault: false },
];

export const staticDeckConfigurations = [
  { id: DECK_CONFIG_IDS.MAIN_DECK, presetId: PRESET_IDS.A321_P2F_STANDARD, deckCode: "MAIN", deckName: "Main Deck", maxStructuralWeightKg: 27500, sequence: 1 },
  { id: DECK_CONFIG_IDS.LOWER_FWD, presetId: PRESET_IDS.A321_P2F_STANDARD, deckCode: "LOWER_FWD", deckName: "Lower Deck Forward", maxStructuralWeightKg: 5670, sequence: 2 },
  { id: DECK_CONFIG_IDS.LOWER_AFT, presetId: PRESET_IDS.A321_P2F_STANDARD, deckCode: "LOWER_AFT", deckName: "Lower Deck Aft", maxStructuralWeightKg: 6286, sequence: 3 },
  { id: DECK_CONFIG_IDS.BULK, presetId: PRESET_IDS.A321_P2F_STANDARD, deckCode: "BULK", deckName: "Bulk Cargo", maxStructuralWeightKg: 770, sequence: 4 },
];

export const staticLoadingPositions = [
  // Main Deck positions
  { id: "12f0e617-d945-4410-bd74-b23e908c43ba", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "1L", sequenceNumber: 1, maxWeightKg: 2268, armStationCm: 650, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 0, yOffset: 0, colIndex: 0, rowIndex: 0 },
  { id: "65669b48-c571-4574-a107-3290c217d080", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "1R", sequenceNumber: 2, maxWeightKg: 2268, armStationCm: 650, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 0, yOffset: 125, colIndex: 0, rowIndex: 1 },
  { id: "be9edcf9-60c2-4ba3-927f-234ae0365b29", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "2L", sequenceNumber: 3, maxWeightKg: 2268, armStationCm: 750, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 100, yOffset: 0, colIndex: 1, rowIndex: 0 },
  { id: "b75a6ca2-f432-4879-a959-c92c25774a4f", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "2R", sequenceNumber: 4, maxWeightKg: 2268, armStationCm: 750, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 100, yOffset: 125, colIndex: 1, rowIndex: 1 },
  { id: "a972f440-13f3-4048-8c54-0fc86815c706", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "3L", sequenceNumber: 5, maxWeightKg: 2722, armStationCm: 850, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 200, yOffset: 0, colIndex: 2, rowIndex: 0 },
  { id: "fa817a61-9a88-41ca-ba83-c648a3bd2756", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "3R", sequenceNumber: 6, maxWeightKg: 2722, armStationCm: 850, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 200, yOffset: 125, colIndex: 2, rowIndex: 1 },
  { id: "040f9f63-1823-49ac-ba88-984e0060970e", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "4L", sequenceNumber: 7, maxWeightKg: 3175, armStationCm: 950, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 300, yOffset: 0, colIndex: 3, rowIndex: 0 },
  { id: "ddd70b6b-0e4b-4d2c-ab48-62eb2e57b9b5", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "4R", sequenceNumber: 8, maxWeightKg: 3175, armStationCm: 950, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 300, yOffset: 125, colIndex: 3, rowIndex: 1 },
  { id: "803be322-3cf3-4d2e-9a3a-ae9972171d13", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "5L", sequenceNumber: 9, maxWeightKg: 2722, armStationCm: 1050, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 400, yOffset: 0, colIndex: 4, rowIndex: 0 },
  { id: "151603c6-2158-44a3-820b-06b2b35633d6", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "5R", sequenceNumber: 10, maxWeightKg: 2722, armStationCm: 1050, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 400, yOffset: 125, colIndex: 4, rowIndex: 1 },
  { id: "c58383e1-1ded-4335-b986-6ae3955a93f1", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "6L", sequenceNumber: 11, maxWeightKg: 2268, armStationCm: 1150, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 500, yOffset: 0, colIndex: 5, rowIndex: 0 },
  { id: "734a3517-e608-4d9a-bde3-d7244d94bbd3", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "6R", sequenceNumber: 12, maxWeightKg: 2268, armStationCm: 1150, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH", "RAP"], acceptsBulkCargo: false, maxHeightCm: 160, contourCode: "HALF_WIDTH", xOffset: 500, yOffset: 125, colIndex: 5, rowIndex: 1 },
  { id: "1a836b10-5163-40e9-a10f-0198ea0d1d2e", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "7L", sequenceNumber: 13, maxWeightKg: 1814, armStationCm: 1250, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH"], acceptsBulkCargo: false, maxHeightCm: 140, contourCode: "HALF_WIDTH", xOffset: 600, yOffset: 0, colIndex: 6, rowIndex: 0 },
  { id: "d2c13d38-b678-4cff-9caa-32520a4d7b11", deckId: DECK_CONFIG_IDS.MAIN_DECK, positionCode: "7R", sequenceNumber: 14, maxWeightKg: 1814, armStationCm: 1250, compatibleUldTypes: ["PMC", "PAG", "PAJ", "PAH"], acceptsBulkCargo: false, maxHeightCm: 140, contourCode: "HALF_WIDTH", xOffset: 600, yOffset: 125, colIndex: 6, rowIndex: 1 },
  // Lower Deck Forward
  { id: "6bff12d4-5ec0-4c39-be0d-72ac0bcefb26", deckId: DECK_CONFIG_IDS.LOWER_FWD, positionCode: "11L", sequenceNumber: 1, maxWeightKg: 1587, armStationCm: 680, compatibleUldTypes: ["AKE", "AKH", "PKX", "FQA", "PEB", "DQF", "RKN"], acceptsBulkCargo: false, maxHeightCm: 114, contourCode: "HALF_WIDTH", xOffset: 0, yOffset: 0, colIndex: 0, rowIndex: 0 },
  { id: "9f0c740a-241d-458d-b138-6773e9520960", deckId: DECK_CONFIG_IDS.LOWER_FWD, positionCode: "11R", sequenceNumber: 2, maxWeightKg: 1587, armStationCm: 680, compatibleUldTypes: ["AKE", "AKH", "PKX", "FQA", "PEB", "DQF", "RKN"], acceptsBulkCargo: false, maxHeightCm: 114, contourCode: "HALF_WIDTH", xOffset: 0, yOffset: 80, colIndex: 0, rowIndex: 1 },
  { id: "dc8477fb-0dbf-463e-b7ac-a7e0139e2b05", deckId: DECK_CONFIG_IDS.LOWER_FWD, positionCode: "12L", sequenceNumber: 3, maxWeightKg: 1587, armStationCm: 780, compatibleUldTypes: ["AKE", "AKH", "PKX", "FQA", "PEB", "DQF", "RKN"], acceptsBulkCargo: false, maxHeightCm: 114, contourCode: "HALF_WIDTH", xOffset: 100, yOffset: 0, colIndex: 1, rowIndex: 0 },
  { id: "3ff3c6f3-9355-4eac-9db9-58f18674e242", deckId: DECK_CONFIG_IDS.LOWER_FWD, positionCode: "12R", sequenceNumber: 4, maxWeightKg: 1587, armStationCm: 780, compatibleUldTypes: ["AKE", "AKH", "PKX", "FQA", "PEB", "DQF", "RKN"], acceptsBulkCargo: false, maxHeightCm: 114, contourCode: "HALF_WIDTH", xOffset: 100, yOffset: 80, colIndex: 1, rowIndex: 1 },
  // Lower Deck Aft
  { id: "c676f603-3e8c-4fcf-ae29-edae081f80af", deckId: DECK_CONFIG_IDS.LOWER_AFT, positionCode: "41L", sequenceNumber: 1, maxWeightKg: 1587, armStationCm: 1180, compatibleUldTypes: ["AKE", "AKH", "PKX", "FQA", "PEB", "DQF", "RKN"], acceptsBulkCargo: false, maxHeightCm: 114, contourCode: "HALF_WIDTH", xOffset: 0, yOffset: 0, colIndex: 0, rowIndex: 0 },
  { id: "b067819c-8d61-40ef-a7c0-37eb4edd8762", deckId: DECK_CONFIG_IDS.LOWER_AFT, positionCode: "41R", sequenceNumber: 2, maxWeightKg: 1587, armStationCm: 1180, compatibleUldTypes: ["AKE", "AKH", "PKX", "FQA", "PEB", "DQF", "RKN"], acceptsBulkCargo: false, maxHeightCm: 114, contourCode: "HALF_WIDTH", xOffset: 0, yOffset: 80, colIndex: 0, rowIndex: 1 },
  { id: "ef2e45fc-bf8d-45fa-9289-8666032bd280", deckId: DECK_CONFIG_IDS.LOWER_AFT, positionCode: "42L", sequenceNumber: 3, maxWeightKg: 1587, armStationCm: 1280, compatibleUldTypes: ["AKE", "AKH", "PKX", "FQA", "PEB", "DQF", "RKN"], acceptsBulkCargo: false, maxHeightCm: 114, contourCode: "HALF_WIDTH", xOffset: 100, yOffset: 0, colIndex: 1, rowIndex: 0 },
  { id: "449b19ce-9a2a-46cc-a341-2419cf499703", deckId: DECK_CONFIG_IDS.LOWER_AFT, positionCode: "42R", sequenceNumber: 4, maxWeightKg: 1587, armStationCm: 1280, compatibleUldTypes: ["AKE", "AKH", "PKX", "FQA", "PEB", "DQF", "RKN"], acceptsBulkCargo: false, maxHeightCm: 114, contourCode: "HALF_WIDTH", xOffset: 100, yOffset: 80, colIndex: 1, rowIndex: 1 },
  // Bulk
  { id: "b5f3bd52-84a2-460f-8cce-0449b1f48905", deckId: DECK_CONFIG_IDS.BULK, positionCode: "51", sequenceNumber: 1, maxWeightKg: 907, armStationCm: 1380, compatibleUldTypes: [], acceptsBulkCargo: true, maxHeightCm: 90, contourCode: "BULK", xOffset: 0, yOffset: 0, colIndex: 0, rowIndex: 0 },
];

export const staticCgEnvelopes = [
  { id: "aa58ad63-4a2c-47c3-a098-06aae47b9d8d", aircraftId: AIRCRAFT_IDS.A321_P2F, envelopeType: "ZERO_FUEL", forwardLimitPercentMac: 15, aftLimitPercentMac: 38, description: "Zero Fuel Weight CG Envelope" },
  { id: "af201c01-2561-4cb8-9626-72b3f2d5102b", aircraftId: AIRCRAFT_IDS.A321_P2F, envelopeType: "TAKEOFF", forwardLimitPercentMac: 15, aftLimitPercentMac: 38, description: "Takeoff Weight CG Envelope" },
  { id: "dbbed0be-93df-4276-8a7a-84941218a83e", aircraftId: AIRCRAFT_IDS.A321_P2F, envelopeType: "LANDING", forwardLimitPercentMac: 15, aftLimitPercentMac: 38, description: "Landing Weight CG Envelope" },
];

export const staticCgEnvelopePoints = [
  // Zero Fuel Envelope
  { id: "83ae9b69-26f5-4ffa-adb8-46672af11905", envelopeId: "aa58ad63-4a2c-47c3-a098-06aae47b9d8d", sequence: 1, weightKg: 48500, cgPercentMac: 15, cgIndex: 0 },
  { id: "30480da9-cc71-4639-abb8-39d0b88879a9", envelopeId: "aa58ad63-4a2c-47c3-a098-06aae47b9d8d", sequence: 2, weightKg: 48500, cgPercentMac: 38, cgIndex: 100 },
  { id: "691254ee-041a-446d-821b-20a1722087e9", envelopeId: "aa58ad63-4a2c-47c3-a098-06aae47b9d8d", sequence: 3, weightKg: 63000, cgPercentMac: 38, cgIndex: 100 },
  { id: "ad211ca9-aeef-4af4-b2a9-055dbc53b16c", envelopeId: "aa58ad63-4a2c-47c3-a098-06aae47b9d8d", sequence: 4, weightKg: 63000, cgPercentMac: 15, cgIndex: 0 },
  // Takeoff Envelope
  { id: "839929a7-49c2-44bf-a95e-d1e6069d571e", envelopeId: "af201c01-2561-4cb8-9626-72b3f2d5102b", sequence: 1, weightKg: 48500, cgPercentMac: 15, cgIndex: 0 },
  { id: "38d747bc-f294-430b-b8b7-f862fca43c1a", envelopeId: "af201c01-2561-4cb8-9626-72b3f2d5102b", sequence: 2, weightKg: 48500, cgPercentMac: 38, cgIndex: 100 },
  { id: "5a9b7410-8e25-4153-a9bb-d5d583321365", envelopeId: "af201c01-2561-4cb8-9626-72b3f2d5102b", sequence: 3, weightKg: 77000, cgPercentMac: 38, cgIndex: 100 },
  { id: "f70c4452-6f8c-4ae0-8aab-207a8baf3268", envelopeId: "af201c01-2561-4cb8-9626-72b3f2d5102b", sequence: 4, weightKg: 77000, cgPercentMac: 15, cgIndex: 0 },
  // Landing Envelope
  { id: "a63221e0-961a-4024-aaca-51d76fe4b8b0", envelopeId: "dbbed0be-93df-4276-8a7a-84941218a83e", sequence: 1, weightKg: 48500, cgPercentMac: 15, cgIndex: 0 },
  { id: "84e299f7-316f-468d-93a5-a02eb1656663", envelopeId: "dbbed0be-93df-4276-8a7a-84941218a83e", sequence: 2, weightKg: 48500, cgPercentMac: 38, cgIndex: 100 },
  { id: "25d0d050-4b9c-4edd-bfd0-40f6ef8faea7", envelopeId: "dbbed0be-93df-4276-8a7a-84941218a83e", sequence: 3, weightKg: 66800, cgPercentMac: 38, cgIndex: 100 },
  { id: "ad486d6f-f6e5-4d8c-becd-04bfb40aec80", envelopeId: "dbbed0be-93df-4276-8a7a-84941218a83e", sequence: 4, weightKg: 66800, cgPercentMac: 15, cgIndex: 0 },
];

export const staticFlights = [
  {
    id: FLIGHT_IDS.RY501_KUL_SIN,
    flightNumber: "RY501",
    aircraftId: AIRCRAFT_IDS.A321_P2F,
    originId: LOCATION_IDS.KUL,
    destinationId: LOCATION_IDS.SIN,
    scheduledDeparture: new Date("2025-01-15T08:00:00+08:00"),
    scheduledArrival: new Date("2025-01-15T09:30:00+08:00"),
    actualDeparture: null,
    actualArrival: null,
    status: "SCHEDULED",
  },
  {
    id: FLIGHT_IDS.RY502_KUL_HKG,
    flightNumber: "RY502",
    aircraftId: AIRCRAFT_IDS.A321_P2F,
    originId: LOCATION_IDS.KUL,
    destinationId: LOCATION_IDS.HKG,
    scheduledDeparture: new Date("2025-01-15T14:00:00+08:00"),
    scheduledArrival: new Date("2025-01-15T18:00:00+08:00"),
    actualDeparture: null,
    actualArrival: null,
    status: "SCHEDULED",
  },
];

export const staticUlds = [
  // KUL - PMC Pallets
  { id: "0aae3c94-5f4c-40d3-9b21-2d80e26574a9", uldNumber: "PMC12345RY", uldTypeId: ULD_TYPE_IDS.PMC, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "dc715c45-2194-4538-8269-ccab09d10bc8", uldNumber: "PMC12346RY", uldTypeId: ULD_TYPE_IDS.PMC, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "21c31fd4-0538-495e-8bad-2e42bb6d7bb8", uldNumber: "PMC12347RY", uldTypeId: ULD_TYPE_IDS.PMC, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "cd3260b9-96c9-4be1-b111-5cf05aacf517", uldNumber: "PMC12348RY", uldTypeId: ULD_TYPE_IDS.PMC, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "af9d97ac-a969-49dd-bea5-a8c5fc895f37", uldNumber: "PMC12349RY", uldTypeId: ULD_TYPE_IDS.PMC, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "7f8c36ea-1b50-4b21-8b72-b3d96d3b7584", uldNumber: "PMC12350RY", uldTypeId: ULD_TYPE_IDS.PMC, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  // KUL - AKE Containers
  { id: "15f69fa5-8ab7-44fd-a608-4f62a609f3bc", uldNumber: "AKE54321RY", uldTypeId: ULD_TYPE_IDS.AKE, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "a92e7ef8-7e50-4b7e-9bba-ef49b7f1e91c", uldNumber: "AKE54322RY", uldTypeId: ULD_TYPE_IDS.AKE, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "b03f8fa9-8f61-4c8f-accc-fa5ac8f2fa2d", uldNumber: "AKE54323RY", uldTypeId: ULD_TYPE_IDS.AKE, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "c14g9gb0-9g72-5d9g-bddd-gb6bd9g3gb3e", uldNumber: "AKE54324RY", uldTypeId: ULD_TYPE_IDS.AKE, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  // KUL - RKN Refrigerated
  { id: "f6c308e8-06e9-4ddd-98b0-f175175617e3", uldNumber: "RKN98765RY", uldTypeId: ULD_TYPE_IDS.RKN, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "a7b8c9d0-e1f2-3a4b-5c6d-e7f8a9b0c1d2", uldNumber: "RKN98766RY", uldTypeId: ULD_TYPE_IDS.RKN, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  // KUL - FQA Containers
  { id: "e5f6a7b8-c9d0-1e2f-3a4b-c5d6e7f8a9b0", uldNumber: "FQA34567RY", uldTypeId: ULD_TYPE_IDS.FQA, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "f6a7b8c9-d0e1-2f3a-4b5c-d6e7f8a9b0c1", uldNumber: "FQA34568RY", uldTypeId: ULD_TYPE_IDS.FQA, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  // KUL - PAG Pallets
  { id: "a7b8c9d0-e1f2-3a4b-5c6d-e7f8a9b0c1d3", uldNumber: "PAG23456RY", uldTypeId: ULD_TYPE_IDS.PAG, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
  { id: "b8c9d0e1-f2a3-4b5c-6d7e-f8a9b0c1d2e4", uldNumber: "PAG23457RY", uldTypeId: ULD_TYPE_IDS.PAG, locationId: LOCATION_IDS.KUL, ownerCode: "RY", status: "AVAILABLE" },
];

export const staticAirWaybills = [
  // Flight RY501 (KUL -> SIN)
  { id: "cfa118fe-d58b-40c2-8efd-3edbee43f9a6", awbNumber: "539-10104500", flightId: FLIGHT_IDS.RY501_KUL_SIN, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.SIN, shipperName: "BALANCE FREIGHT SDN BHD", consigneeName: "GLOBAL EXPRESS SOLUTIONS PTE LTD", totalPieces: 8, totalWeightKg: 3798, totalVolumeM3: 22.6643, natureOfGoods: "T-SHIRTS, TROUSERS, JACKETS, HANDBAGS, SNEAKERS, SLIPPERS", specialHandlingCodes: null, status: "ACCEPTED" },
  { id: "5249ad2c-e15d-40fd-ac7f-a4f1a93b0144", awbNumber: "539-10104496", flightId: FLIGHT_IDS.RY501_KUL_SIN, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.SIN, shipperName: "SKYWIN GLOBAL LOGISTICS SDN BHD", consigneeName: "STANDARD JOY PTE LTD", totalPieces: 6, totalWeightKg: 1983, totalVolumeM3: 9.9, natureOfGoods: "ELECTRONIC PRODUCTS WITH LITHIUM ION BATTERIES UN3481", specialHandlingCodes: ["ELI", "CAO"], status: "ACCEPTED" },
  { id: "8c311b46-f6f5-4810-963f-8e7f5e5321f4", awbNumber: "539-10075752", flightId: FLIGHT_IDS.RY501_KUL_SIN, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.SIN, shipperName: "DIAMOND INTERNATIONAL SDN BHD", consigneeName: "COLD CHAIN SINGAPORE PTE LTD", totalPieces: 10, totalWeightKg: 5850, totalVolumeM3: 38.988, natureOfGoods: "FRESH MANGOSTEEN", specialHandlingCodes: ["PER", "COL"], status: "ACCEPTED" },
  { id: "41ac6f9f-ee59-4c2c-881c-4ece90c247c0", awbNumber: "539-10103730", flightId: FLIGHT_IDS.RY501_KUL_SIN, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.SIN, shipperName: "GEELY AUTOMOBILE INTERNATIONAL CORP", consigneeName: "PROTON TANJUNG MALIM SDN BHD", totalPieces: 5, totalWeightKg: 4400, totalVolumeM3: 5.28, natureOfGoods: "FUEL_RAIL_INJECTOR_SUBASSEMBLY CYLINDER HEAD", specialHandlingCodes: ["HEA"], status: "ACCEPTED" },
  { id: "c969e034-eab1-4ec4-897e-434ef46945b9", awbNumber: "539-10109993", flightId: FLIGHT_IDS.RY501_KUL_SIN, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.SIN, shipperName: "J&T EXPRESS (M) SDN BHD", consigneeName: "AZAM SOLUTIONS PTE LTD", totalPieces: 10, totalWeightKg: 100, totalVolumeM3: 0.01, natureOfGoods: "COURIER MATERIAL", specialHandlingCodes: null, status: "ACCEPTED" },
  { id: "81e901c7-b479-48cf-9470-3ae70de8ff28", awbNumber: "539-10102481", flightId: FLIGHT_IDS.RY501_KUL_SIN, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.SIN, shipperName: "CTS INTERNATIONAL LOGISTICS CORP LIMITED", consigneeName: "TRANSCARGO WORLDWIDE (M) SDN BHD", totalPieces: 4, totalWeightKg: 700, totalVolumeM3: 3.9276, natureOfGoods: "GAS RECOVERY UNIT GC-SF6-12/200", specialHandlingCodes: ["HEA"], status: "ACCEPTED" },
  // Flight RY502 (KUL -> HKG)
  { id: "4a67f748-046d-4050-83a8-a7dfa397ecea", awbNumber: "539-10103446", flightId: FLIGHT_IDS.RY502_KUL_HKG, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.HKG, shipperName: "SHENZHEN KINGFLYING FORWARDERS CO LTD", consigneeName: "WORLD ASIA LOGISTICS (HK) LTD", totalPieces: 6, totalWeightKg: 1602, totalVolumeM3: 6.9, natureOfGoods: "SHOES 64059010 HANDBAGS 42021219", specialHandlingCodes: null, status: "ACCEPTED" },
  { id: "e6d31cd0-854b-4751-b63f-5fef7907c852", awbNumber: "539-10102271", flightId: FLIGHT_IDS.RY502_KUL_HKG, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.HKG, shipperName: "JIANGSU DTW INTERNATIONAL TRANSPORTATION CO LTD", consigneeName: "MMA FREIGHT SERVICES (HK) LTD", totalPieces: 8, totalWeightKg: 408, totalVolumeM3: 2.0128, natureOfGoods: "HONDA DPS HOUSING", specialHandlingCodes: null, status: "ACCEPTED" },
  { id: "0758e2d7-ae80-4f2a-aee8-625b2c5761f5", awbNumber: "539-10103516", flightId: FLIGHT_IDS.RY502_KUL_HKG, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.HKG, shipperName: "SHENZHEN YOUTONGDA INTL FREIGHT FORWARDING CO LTD", consigneeName: "GLOBAL EXPRESS SOLUTIONS (HK) LTD", totalPieces: 7, totalWeightKg: 1707, totalVolumeM3: 9.2, natureOfGoods: "CONSUMER ELECTRONICS WITH LITHIUM METAL BATTERIES UN3091", specialHandlingCodes: ["ELM", "CAO"], status: "ACCEPTED" },
  { id: "40d30476-0045-4534-8fa0-a4e3d689c959", awbNumber: "539-10102223", flightId: FLIGHT_IDS.RY502_KUL_HKG, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.HKG, shipperName: "PHARMEX LOGISTICS (BEIJING) LIMITED", consigneeName: "HONG KONG PHARMA DISTRIBUTORS LTD", totalPieces: 8, totalWeightKg: 868, totalVolumeM3: 0.9198, natureOfGoods: "PHARMACEUTICAL PRODUCTS - VACCINES AND BIOLOGICS", specialHandlingCodes: ["PIL", "COL"], status: "ACCEPTED" },
  { id: "e9d32f40-890d-4570-a833-25cf390f0bde", awbNumber: "539-10102131", flightId: FLIGHT_IDS.RY502_KUL_HKG, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.HKG, shipperName: "JIANGSU SOHO INTERNATIONAL GROUP WUXI CO LTD", consigneeName: "LF LANSEN (HK) LTD", totalPieces: 4, totalWeightKg: 2092, totalVolumeM3: 6.7502, natureOfGoods: "METAL SHEET PANEL", specialHandlingCodes: ["HEA"], status: "ACCEPTED" },
  { id: "b03623dd-ef16-4aa4-835d-f0b5368f38aa", awbNumber: "539-10103096", flightId: FLIGHT_IDS.RY502_KUL_HKG, originId: LOCATION_IDS.KUL, destinationId: LOCATION_IDS.HKG, shipperName: "SINOTRANS CHANGJIANG CO LTD", consigneeName: "NETWORK FREIGHT (HK) LTD", totalPieces: 4, totalWeightKg: 178, totalVolumeM3: 0.624, natureOfGoods: "RIVETING MACHINE", specialHandlingCodes: ["HEA"], status: "ACCEPTED" },
];

// Generate cargo items from AWB data
function generateCargoItems() {
  const items: Array<{
    id: string;
    awbId: string;
    awbNumber: string;
    pieceNumber: number;
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    volumeM3: number;
    isStackable: boolean;
    maxStackWeightKg: number | null;
    isTiltable: boolean;
    isDangerousGoods: boolean;
    dgClassId: string | null;
    dgClassCode: string | null;
    tempZoneId: string | null;
    tempZoneCode: string | null;
    isLiveAnimal: boolean;
    isFoodstuff: boolean;
    specialHandlingCodes: string[] | null;
    priority: "HIGH" | "STANDARD" | "LOW";
    destinationId: string;
    loadStatus: string;
  }> = [];

  // AWB 1 - Fashion (8 pieces, ~475kg each)
  for (let i = 0; i < 8; i++) {
    items.push({
      id: `73a1313d-4ce6-47bc-94fa-f210952fdd8${i}`,
      awbId: "cfa118fe-d58b-40c2-8efd-3edbee43f9a6",
      awbNumber: "539-10104500",
      pieceNumber: i + 1,
      weightKg: i === 7 ? 477 : 474,
      lengthCm: 80, widthCm: 60, heightCm: 50,
      volumeM3: 0.24,
      isStackable: true, maxStackWeightKg: 500, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: null, priority: "STANDARD",
      destinationId: LOCATION_IDS.SIN, loadStatus: "PENDING",
    });
  }

  // AWB 2 - Electronics with Lithium Ion Batteries (6 pieces, ~330kg each)
  for (let i = 0; i < 6; i++) {
    items.push({
      id: `b0eb28df-28d3-420c-b0c9-dbcc2205a5a${i}`,
      awbId: "5249ad2c-e15d-40fd-ac7f-a4f1a93b0144",
      awbNumber: "539-10104496",
      pieceNumber: i + 1,
      weightKg: i === 5 ? 333 : 330,
      lengthCm: 70, widthCm: 55, heightCm: 45,
      volumeM3: 0.17,
      isStackable: true, maxStackWeightKg: 300, isTiltable: false,
      isDangerousGoods: true, dgClassId: DG_CLASS_IDS.CLASS_9, dgClassCode: "9",
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: ["ELI", "CAO"], priority: "STANDARD",
      destinationId: LOCATION_IDS.SIN, loadStatus: "PENDING",
    });
  }

  // AWB 3 - Fresh Mangosteen (10 pieces, 585kg each)
  for (let i = 0; i < 10; i++) {
    items.push({
      id: `7547d786-c324-4883-b7b0-2b4a3337e49${i}`,
      awbId: "8c311b46-f6f5-4810-963f-8e7f5e5321f4",
      awbNumber: "539-10075752",
      pieceNumber: i + 1,
      weightKg: 585,
      lengthCm: 60, widthCm: 40, heightCm: 35,
      volumeM3: 0.084,
      isStackable: false, maxStackWeightKg: null, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: TEMP_ZONE_IDS.CHILLED, tempZoneCode: "CHILLED",
      isLiveAnimal: false, isFoodstuff: true,
      specialHandlingCodes: ["PER", "COL"], priority: "HIGH",
      destinationId: LOCATION_IDS.SIN, loadStatus: "PENDING",
    });
  }

  // AWB 4 - Auto Parts (5 pieces, 880kg each)
  for (let i = 0; i < 5; i++) {
    items.push({
      id: `6e81adfc-b6a8-4217-ac07-6ac70e24f1d${i}`,
      awbId: "41ac6f9f-ee59-4c2c-881c-4ece90c247c0",
      awbNumber: "539-10103730",
      pieceNumber: i + 1,
      weightKg: 880,
      lengthCm: 60, widthCm: 50, heightCm: 40,
      volumeM3: 0.12,
      isStackable: false, maxStackWeightKg: null, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: ["HEA"], priority: "STANDARD",
      destinationId: LOCATION_IDS.SIN, loadStatus: "PENDING",
    });
  }

  // AWB 5 - Courier Material (10 pieces, 10kg each)
  for (let i = 0; i < 10; i++) {
    items.push({
      id: `ae77d863-624c-435d-82fc-e5abc27e26f${i}`,
      awbId: "c969e034-eab1-4ec4-897e-434ef46945b9",
      awbNumber: "539-10109993",
      pieceNumber: i + 1,
      weightKg: 10,
      lengthCm: 30, widthCm: 25, heightCm: 20,
      volumeM3: 0.015,
      isStackable: true, maxStackWeightKg: 50, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: null, priority: "HIGH",
      destinationId: LOCATION_IDS.SIN, loadStatus: "PENDING",
    });
  }

  // AWB 6 - Industrial Equipment (4 pieces, 175kg each)
  for (let i = 0; i < 4; i++) {
    items.push({
      id: `1e95cb9c-d128-4e73-b002-c738e893d54${i}`,
      awbId: "81e901c7-b479-48cf-9470-3ae70de8ff28",
      awbNumber: "539-10102481",
      pieceNumber: i + 1,
      weightKg: 175,
      lengthCm: 80, widthCm: 60, heightCm: 50,
      volumeM3: 0.24,
      isStackable: false, maxStackWeightKg: null, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: ["HEA"], priority: "STANDARD",
      destinationId: LOCATION_IDS.SIN, loadStatus: "PENDING",
    });
  }

  // AWB 7 - Shoes and Handbags (6 pieces, ~267kg each)
  for (let i = 0; i < 6; i++) {
    items.push({
      id: `eecd1e61-e6e9-4394-8430-592349ac0ef${i}`,
      awbId: "4a67f748-046d-4050-83a8-a7dfa397ecea",
      awbNumber: "539-10103446",
      pieceNumber: i + 1,
      weightKg: 267,
      lengthCm: 70, widthCm: 50, heightCm: 45,
      volumeM3: 0.16,
      isStackable: true, maxStackWeightKg: 200, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: null, priority: "STANDARD",
      destinationId: LOCATION_IDS.HKG, loadStatus: "PENDING",
    });
  }

  // AWB 8 - Honda Auto Parts (8 pieces, 51kg each)
  for (let i = 0; i < 8; i++) {
    items.push({
      id: `7f692468-ae05-4074-a2ad-ea4eb82d757${i}`,
      awbId: "e6d31cd0-854b-4751-b63f-5fef7907c852",
      awbNumber: "539-10102271",
      pieceNumber: i + 1,
      weightKg: 51,
      lengthCm: 45, widthCm: 35, heightCm: 30,
      volumeM3: 0.047,
      isStackable: true, maxStackWeightKg: 150, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: null, priority: "STANDARD",
      destinationId: LOCATION_IDS.HKG, loadStatus: "PENDING",
    });
  }

  // AWB 9 - Consumer Electronics with Lithium Metal Batteries (7 pieces, ~244kg each)
  for (let i = 0; i < 7; i++) {
    items.push({
      id: `cbc73e60-ae48-4dd7-82d5-0fa69f3b5e2${i}`,
      awbId: "0758e2d7-ae80-4f2a-aee8-625b2c5761f5",
      awbNumber: "539-10103516",
      pieceNumber: i + 1,
      weightKg: i === 6 ? 239 : 244,
      lengthCm: 65, widthCm: 50, heightCm: 45,
      volumeM3: 0.15,
      isStackable: true, maxStackWeightKg: 250, isTiltable: false,
      isDangerousGoods: true, dgClassId: DG_CLASS_IDS.CLASS_9, dgClassCode: "9",
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: ["ELM", "CAO"], priority: "STANDARD",
      destinationId: LOCATION_IDS.HKG, loadStatus: "PENDING",
    });
  }

  // AWB 10 - Pharmaceutical Products (8 pieces, ~108.5kg each)
  for (let i = 0; i < 8; i++) {
    items.push({
      id: `ae88c0a7-0979-4f6f-a3c2-c6cf80399ad${i}`,
      awbId: "40d30476-0045-4534-8fa0-a4e3d689c959",
      awbNumber: "539-10102223",
      pieceNumber: i + 1,
      weightKg: i === 7 ? 108 : 108.5,
      lengthCm: 50, widthCm: 40, heightCm: 35,
      volumeM3: 0.07,
      isStackable: false, maxStackWeightKg: null, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: TEMP_ZONE_IDS.CHILLED, tempZoneCode: "CHILLED",
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: ["PIL", "COL"], priority: "HIGH",
      destinationId: LOCATION_IDS.HKG, loadStatus: "PENDING",
    });
  }

  // AWB 11 - Metal Sheet Panels (4 pieces, 523kg each)
  for (let i = 0; i < 4; i++) {
    items.push({
      id: `414bc7de-db7a-46fe-b5f0-579dd1bfa5a${i}`,
      awbId: "e9d32f40-890d-4570-a833-25cf390f0bde",
      awbNumber: "539-10102131",
      pieceNumber: i + 1,
      weightKg: 523,
      lengthCm: 120, widthCm: 80, heightCm: 60,
      volumeM3: 0.58,
      isStackable: false, maxStackWeightKg: null, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: ["HEA"], priority: "STANDARD",
      destinationId: LOCATION_IDS.HKG, loadStatus: "PENDING",
    });
  }

  // AWB 12 - Riveting Machine (4 pieces, 44.5kg each)
  for (let i = 0; i < 4; i++) {
    items.push({
      id: `64944827-5b93-44d9-8b6d-01d4d844be2${i}`,
      awbId: "b03623dd-ef16-4aa4-835d-f0b5368f38aa",
      awbNumber: "539-10103096",
      pieceNumber: i + 1,
      weightKg: 44.5,
      lengthCm: 55, widthCm: 40, heightCm: 35,
      volumeM3: 0.077,
      isStackable: false, maxStackWeightKg: null, isTiltable: false,
      isDangerousGoods: false, dgClassId: null, dgClassCode: null,
      tempZoneId: null, tempZoneCode: null,
      isLiveAnimal: false, isFoodstuff: false,
      specialHandlingCodes: ["HEA"], priority: "STANDARD",
      destinationId: LOCATION_IDS.HKG, loadStatus: "PENDING",
    });
  }

  return items;
}

export const staticCargoItems = generateCargoItems();

export const staticPackingRules = [
  { id: "4770dd87-d7a2-442d-8255-09161d32adf4", ruleText: "Live animals CANNOT be loaded into ULDs at all - they must go directly into approved aircraft compartments", ruleType: "PROHIBITION", priority: 100, category: "LIVE_ANIMAL", isActive: true, examples: ["Dogs must be loaded directly to aircraft hold, not in ULD containers"], structuredRule: { condition: "cargo.isLiveAnimal === true", action: "EXCLUDE_FROM_ULD" }, createdAt: new Date(), updatedAt: new Date() },
  { id: "fe9aa478-8d9e-4c5d-9417-17f1b025f437", ruleText: "Different temperature zones cannot be mixed in the same ULD (frozen, chilled, ambient)", ruleType: "PROHIBITION", priority: 95, category: "TEMPERATURE", isActive: true, examples: ["Frozen seafood (-18°C) cannot be in same ULD as fresh produce (2-8°C)"], structuredRule: { condition: "cargo1.tempZoneId !== cargo2.tempZoneId", action: "SEGREGATE" }, createdAt: new Date(), updatedAt: new Date() },
  { id: "e19a6ef1-92e0-485f-ae7e-32053608930f", ruleText: "Division 6.1 (toxic) and Division 6.2 (infectious) substances must be in separate ULDs from foodstuffs", ruleType: "PROHIBITION", priority: 90, category: "FOOD_CONTAMINATION", isActive: true, examples: ["Chemical samples cannot be loaded with food shipments"], structuredRule: { condition: "(cargo1.dgClassCode in ['6.1', '6.2']) && cargo2.isFoodstuff", action: "SEGREGATE" }, createdAt: new Date(), updatedAt: new Date() },
  { id: "562a7871-f45a-438d-b8d3-ffe5c58f54a6", ruleText: "Class 5.1 (oxidizers) must not be loaded with Class 3 (flammable liquids) - risk of spontaneous ignition", ruleType: "PROHIBITION", priority: 100, category: "DANGEROUS_GOODS", isActive: true, examples: ["Hydrogen peroxide cannot be with alcohol shipments"], structuredRule: { condition: "(cargo1.dgClassCode === '5.1' && cargo2.dgClassCode === '3')", action: "SEGREGATE" }, createdAt: new Date(), updatedAt: new Date() },
  { id: "34edfbea-90e9-453b-adfd-5aacc174916c", ruleText: "Heavy items should be placed at the bottom of the ULD, lighter items on top for stability", ruleType: "PREFERENCE", priority: 70, category: "STACKING", isActive: true, examples: ["Heavy machinery at bottom, clothing packages on top"], structuredRule: { condition: "cargo1.weightKg > cargo2.weightKg", action: "PLACE_BELOW" }, createdAt: new Date(), updatedAt: new Date() },
  { id: "ee96cfe0-bd30-4c32-950b-b1814e9bbaec", ruleText: "Non-stackable items cannot have other cargo placed on top of them", ruleType: "CONSTRAINT", priority: 85, category: "STACKING", isActive: true, examples: ["Fragile electronics marked non-stackable must be on top layer"], structuredRule: { condition: "cargo.isStackable === false", action: "PLACE_ON_TOP" }, createdAt: new Date(), updatedAt: new Date() },
  { id: "9f0fc685-affb-4c35-a6ec-e10563b25c42", ruleText: "Temperature-controlled cargo requires appropriate ULD type (RKN for LD-3, RAP for LD-9 refrigerated)", ruleType: "CONSTRAINT", priority: 90, category: "TEMPERATURE", isActive: true, examples: ["Vaccines requiring 2-8°C must use RKN or RAP containers"], structuredRule: { condition: "cargo.requiresTempControl === true", action: "REQUIRE_REFRIGERATED_ULD" }, createdAt: new Date(), updatedAt: new Date() },
  { id: "58d2aeeb-4b87-4aa0-87cc-5ebd98076c46", ruleText: "General cargo with no special requirements can be mixed together freely", ruleType: "PREFERENCE", priority: 10, category: "GENERAL", isActive: true, examples: ["Clothing shipments can be mixed with electronics (non-DG)"], structuredRule: { condition: "!cargo1.isDangerousGoods && !cargo2.isDangerousGoods", action: "ALLOW_MIX" }, createdAt: new Date(), updatedAt: new Date() },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getStaticFlightById(flightId: string) {
  return staticFlights.find(f => f.id === flightId) ?? null;
}

export function getStaticAircraftById(aircraftId: string) {
  return staticAircrafts.find(a => a.id === aircraftId) ?? null;
}

export function getStaticLocationById(locationId: string) {
  return staticLocations.find(l => l.id === locationId) ?? null;
}

export function getStaticUldTypeById(uldTypeId: string) {
  return staticUldTypes.find(u => u.id === uldTypeId) ?? null;
}

export function getStaticCargoItemsForFlight(flightId: string) {
  const awbsForFlight = staticAirWaybills.filter(awb => awb.flightId === flightId);
  const awbIds = awbsForFlight.map(awb => awb.id);
  return staticCargoItems.filter(item => awbIds.includes(item.awbId));
}

export function getStaticAwbsForFlight(flightId: string) {
  return staticAirWaybills.filter(awb => awb.flightId === flightId);
}

export function getStaticUldsAtLocation(locationId: string) {
  return staticUlds.filter(uld => uld.locationId === locationId && uld.status === "AVAILABLE");
}


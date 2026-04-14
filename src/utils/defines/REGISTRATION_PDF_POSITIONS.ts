export const REGISTRATION_PDF_PREVIEW_WIDTH = 1755
export const REGISTRATION_PDF_PREVIEW_HEIGHT = 1240

const REGISTRATION_PDF_PAGE_2_CREW_ROWS = Array.from({ length: 14 }, (_, index) => ({
  previewLeft: 150,
  previewTop: 610 + index * 35,
  dobPreviewLeft: 1191.6,
  dobPreviewTop: 610 + index * 35,
}))

export const REGISTRATION_PDF_PAGE_1_POSITIONS = {
  eventName: { previewLeft: 364.1, previewTop: 47.2 },
  eventDates: { previewLeft: 1215.6, previewTop: 110.8 },
  boatName: { previewLeft: 234.3, previewTop: 282.6 },
  yachtClub: { previewLeft: 846.3, previewTop: 284.3 },
  contactNameCountry: { previewLeft: 890.7, previewTop: 343.7 },
  contactEmail: { previewLeft: 167.7, previewTop: 347.6 },
  skipperName: { previewLeft: 167.9, previewTop: 411.4 },
  contactPhone: { previewLeft: 1193.1, previewTop: 408.5 },
  certificateOfCompetency: { previewLeft: 433.8, previewTop: 470.2 },
  certificateOfCompetencyExpiry: { previewLeft: 1360.4, previewTop: 470.7 },
  sailNumber: { previewLeft: 204.5, previewTop: 530.9 },
  modelDesign: { previewLeft: 712.7, previewTop: 535.7 },
  boatAge: { previewLeft: 1400.8, previewTop: 535.2 },
  borderNumber: { previewLeft: 231.3, previewTop: 600.7 },
  boatColor: { previewLeft: 738.8, previewTop: 590.4 },
  loa: { previewLeft: 1391.5, previewTop: 600.8 },
  certificateOfNavigation: { previewLeft: 379.1, previewTop: 656.5 },
  certificateOfNavigationExpiry: { previewLeft: 837.7, previewTop: 660.4 },
  countryAndHarbour: { previewLeft: 1340.6, previewTop: 660.3 },
  gphIrcLeft: { previewLeft: 252.7, previewTop: 720.6 },
  gphIrcRight: { previewLeft: 753.1, previewTop: 720.1 },
  crewInsurance: { previewLeft: 600.5, previewTop: 870.2 },
  thirdPartyInsurance: { previewLeft: 550.5, previewTop: 1025.1 },
  entryDate: { previewLeft: 155.8, previewTop: 1086.7 },
  skipperSignature: { previewLeft: 536.7, previewTop: 1089.2 },
} as const

export const REGISTRATION_PDF_PAGE_2_POSITIONS = {
  eventName: { previewLeft: 521.5, previewTop: 40 },
  eventDates: { previewLeft: 1195.2, previewTop: 85 },
  boatName: { previewLeft: 223.8, previewTop: 290 },
  country: { previewLeft: 941.5, previewTop: 290 },
  portOfRegistry: { previewLeft: 1366.3, previewTop: 290 },
  crewRows: REGISTRATION_PDF_PAGE_2_CREW_ROWS,
  entryDate: { previewLeft: 176.2, previewTop: 1115 },
  skipperSignature: { previewLeft: 489.8, previewTop: 1115 },
} as const

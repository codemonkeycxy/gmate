const SINGLE_OPTION = 'single-option';
const MULTI_OPTION = 'multi-option';

const COMPANY_SPECIFIC_FILTERS = {
  uber: [{
    name: 'Location',
    type: SINGLE_OPTION,
    options: [
      'SFO | 1455 Market',
      'SFO | 555 Market',
      'SFO | 685 Market',
      'SEA | 1191 2nd Ave',
      'PAO | 900 Arastradero A',
      'PAO | 900 Arastradero B',
    ],
    validator: (roomStr, location) => roomStr.includes(location)
  }, {
    name: 'Floor',
    type: MULTI_OPTION,
    options: [
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      '7th',
      '8th',
      '9th',
      '10th',
      '11th',
      '12th',
      '13th',
      '14th',
    ],
    validator: (roomStr, floors) => floors.any(floor => roomStr.includes(floor))
  }]
};
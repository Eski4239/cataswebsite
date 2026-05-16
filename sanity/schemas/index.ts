const localizedString = {
  name: 'localizedString',
  type: 'object',
  fields: [
    {name: 'en', type: 'string'},
    {name: 'es', type: 'string'}
  ]
};

export const schemaTypes = [
  localizedString,
  {
    name: 'reel',
    type: 'document',
    fields: [
      {name: 'title', type: 'localizedString'},
      {name: 'slug', type: 'slug', options: {source: 'title.en'}},
      {name: 'instagramUrl', type: 'url'},
      {name: 'description', type: 'localizedString'},
      {name: 'category', type: 'string', options: {list: ['History', 'Regions', 'Grapes', 'Tastings', 'Beginner Guides']}},
      {name: 'featured', type: 'boolean'},
      {name: 'publishedAt', type: 'datetime'}
    ]
  },
  {
    name: 'tasting',
    type: 'document',
    fields: [
      {name: 'title', type: 'localizedString'},
      {name: 'city', type: 'localizedString'},
      {name: 'date', type: 'date'},
      {name: 'description', type: 'localizedString'},
      {name: 'availability', type: 'localizedString'},
      {name: 'coverImage', type: 'image'},
      {name: 'contactCTA', type: 'localizedString'}
    ]
  },
  {
    name: 'bottleOfWeek',
    type: 'document',
    fields: [
      {name: 'wineName', type: 'string'},
      {name: 'winery', type: 'string'},
      {name: 'region', type: 'localizedString'},
      {name: 'story', type: 'localizedString'},
      {name: 'tastingNotes', type: 'localizedString'},
      {name: 'image', type: 'image'},
      {name: 'featured', type: 'boolean'}
    ]
  },
  {
    name: 'aboutContent',
    type: 'document',
    fields: [
      {name: 'portrait', type: 'image'},
      {name: 'philosophy', type: 'localizedString'},
      {name: 'timeline', type: 'array', of: [{type: 'localizedString'}]},
      {name: 'quote', type: 'localizedString'}
    ]
  }
];

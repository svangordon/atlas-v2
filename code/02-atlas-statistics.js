// Import tools and datasets from workshopTools. Make sure to put in your own user name!
var workshopTools = require('users/svangordon/lulc-conference:workshopTools')
var displayAtlasClassification = workshopTools.displayAtlasClassification
var atlasV2_2013 = ee.Image('users/svangordon/conference/atlas_v2/classify/2013')
var atlasV2Collection = workshopTools.atlasV2Collection

var statsAtlasV2_2013 = atlasV2_2013.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    scale: 30,
    maxPixels: 1e13
  })
print("atlasV2 stats 2013", statsAtlasV2_2013)

var pixelCounts = ee.Dictionary(statsAtlasV2_2013.get('b1'))

// Multiply the counts by the conversion coefficient
var areasAtlasV2_2013 = pixelCounts
  .map(function(key, value) {
    return ee.Number(value).multiply(0.0009)
  })

print(areasAtlasV2_2013)

var chartInput = ee.Feature(null, areasAtlasV2_2013)

var atlasClassMetadata = require('users/svangordon/lulc-conference:atlasClassMetadata')
var nameDictionaryFrench = atlasClassMetadata.nameDictionaryFrench

var chartLabels = nameDictionaryFrench.select(chartInput.propertyNames()).getInfo()

var chart = ui.Chart.feature.byProperty(ee.FeatureCollection(chartInput), chartLabels)

print(chart)

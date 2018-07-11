var waterJrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");
// https://explorer.earthengine.google.com/#detail/UMD%2Fhansen%2Fglobal_forest_change_2017_v1_5
var hansen = ee.Image('UMD/hansen/global_forest_change_2017_v1_5')
var hansenVis = {min: 0, max:100, bands: "treecover2000", palette: "3d3d3d,080a02,080a02,080a02,106e12,37a930,03ff17"}

var waterCollection = ee.ImageCollection("JRC/GSW1_0/YearlyHistory")
var waterVis = {min: 0, max: 3, palette: "cccccc,ffffff,99d9ea,0000ff"}
Map.addLayer(waterCollection, waterVis, "Water Class")

print(waterCollection)
Map.addLayer(hansen, hansenVis, 'Forest 2000')

// Load the LSIB country boundary collection.
var countryBoundaries = ee.FeatureCollection('USDOS/LSIB/2013')

// Get boundaries for a single country
var countryGeometry = countryBoundaries.filter(ee.Filter.equals('name', 'NIGERIA'))

// Loss areas
var annualLosses = ee.List.sequence(1, 17)
  .map(function(lossyear) {
    return hansen.select('lossyear')
      .eq(ee.Image.constant(lossyear))
      .multiply(ee.Image.pixelArea())
      .reduceRegion({
        geometry: countryGeometry,
        reducer: ee.Reducer.sum(),
        maxPixels: 1e13
      })
      .get('lossyear')
  })

// Loss areas, other way

print('Annual Forest Loss (m^2)', annualLosses)

/*
  Chart the loss
*/
var lossFc = annualLosses.map(function(annualLoss) {
  return ee.Feature(null, {
    'annualLoss': annualLoss
  })
})
lossFc = ee.FeatureCollection(lossFc)

var yearLabels = ee.List.sequence(2001, 2017)
  .map(function(year) {
    return ee.Number(year).format('%d')
  })

print(yearLabels)

// var lossYearArray = annualLosses.zip(ee.List.sequence(2001,2017))
// Not this:
// {
//   "offset": 2003.7789883384153,
//   "scale": 4.106325262551609e-9
// }
// =====
// This:
// {
//   "offset": -272681985212.27222,
//   "scale": 136363086.68786043
// }
// 2001: 180551250.136505
// 2017: 2362360637.142273
// [[2001, 180551250.136505],
// [2017, 2362360637.142273]]
//
// function slopeForYear(year) {
//   y = ee.Number(year).multip
// }

var lossYearArray = ee.List.sequence(2001,2017).zip(annualLosses)
var linFit = lossYearArray.reduce(ee.Reducer.linearFit())
// print(linFit)
linFit = ee.Dictionary(linFit)
var slope = ee.Number(linFit.get('scale'))
var offset = ee.Number(linFit.get('offset'))
var ys = ee.List.sequence(2001,2017).map(function(year) {
  return ee.Number(year).multiply(slope).add(offset)
})
print(ys)

// print(ee.Array(lossYearArray))
// print(lossYearArray.reduce(ee.Reducer.linearFit()))

// print(ee.Array(annualLosses))
var input = annualLosses.zip(ys).zip(yearLabels)


var yearFeatures = input.map(function(data) {
  data = ee.List(data).flatten()
  return ee.Feature(null, {
    loss: ee.List(data).get(0),
    bestFit: ee.List(data).get(1),
    year: ee.List(data).get(2)
  })
})
yearFeatures = ee.FeatureCollection(yearFeatures)

var chartOptions = {
  series: {
    // 0: {lineWidth: 1, pointSize: 2},
    1: {type: 'bars'}
  }
}

var chart = ui.Chart.feature.byFeature(yearFeatures, 'year')
  .setOptions(chartOptions)
print(chart)

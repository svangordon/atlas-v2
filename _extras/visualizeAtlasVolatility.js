var zoneGeometries = require('users/svangordon/west-africa-lulc:zoneGeometries')

function displayClassification(classificationImage, layerName) {
  // Cast classificationImage to Image
  classificationImage = ee.Image(classificationImage)

  var atlasPalette = [
    "8400a8", // Forest / Forêt
    "8bad8b", // Savanna / Savane
    "000080", // Wetland - floodplain / Prairie marécageuse - vallée inondable
    "ffcc99", // Steppe / Steppe
    "808000", // Plantation / Plantation
    "33cccc", // Mangrove / Mangrove
    "ffff96", // Agriculture / Zone de culture
    "3366ff", // Water bodies / Plans d'eau
    "ff99cc", // Sandy area / surfaces sableuses
    "969696", // Rocky land / Terrains rocheux
    "a87000", // Bare soil / Sols dénudés
    "ff0000", // Settlements / Habitations
    "ccff66", // Irrigated agriculture / Cultures irriguées
    "a95ce6", // Gallery forest and riparian forest / Forêt galerie et formation ripicole
    "d296e6", // Degraded forest / Forêt dégradée
    "a83800", // Bowe / Bowé
    "f5a27a", // Thicket / Fourré
    "ebc961", // Agriculture in shallows and recession / Cultures des bas-fonds et de décrue
    "28734b", // Woodland / Forêt claire
    "ebdf73", // Cropland and fallow with oil palms / Cultures et jachère sous palmier à huile
    "beffa6", // Swamp forest / Forêt marécageuse
    "a6c28c", // Sahelian short grass savanna / Savane sahélienne
    "0a9696", // Herbaceous savanna / Savane herbacée
    "749373", // Shrubland / Zone arbustive
    "505050", // Open mine / Carrière
    "FFFFFF"  // Cloud / Nuage
  ]
  var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
  var remappedImage = classificationImage.remap(atlasClasses, ee.List.sequence(1, 26))
  classificationImage = classificationImage.addBands(remappedImage)
  Map.addLayer(classificationImage, {min:1, max:26, palette: atlasPalette, bands:'remapped'}, layerName)
}



var atlasV2_2000 = ee.Image('users/svangordon/conference/atlas_v2/classify/2000')
var atlasV2_2016 = ee.Image('users/svangordon/conference/atlas_v2/classify/2016')

displayClassification(atlasV2_2000, 'AtlasV2 2000')
displayClassification(atlasV2_2016, 'AtlasV2 2016')


/*
  Main loop. Comment or uncomment function calls to enable / disable various
  displays. Change the order that they're called in to change the display order;
  first thing called goes on the bottom.
*/
function main() {
  // displayZonesGrid()
  // displayClassification()
  // getAggregateConversionVolatility(0.3)
  // displayVolatility()

  // displayPrecipitation()
  // displayPrecipTimeSeries()
  // XXX: Doesn't work
  // displayPrecipAnomaly()

  // displayRegionalClassification()
  displayRegionalVolatility()
  //
  // displayClassificationReports()

  // Adjust the zoom by changing viewWindow.max in this function
  // displayClassCountTimeSeries()


  // exportClassification('image')
  // exportClassification('video')
  // exportConversionVolatility()
  // exportRegionalConversionVolatility()
}

var confidenceThreshold = 0.3;

var caseStudies = {
 // 'Bamako':  getZonesGeometry(2),
 // 'Baoule':  getZonesGeometry(16),
 // 'Bobo-Diolasso':  getZonesGeometry(15),
 // 'Dabola':  getZonesGeometry(3),
 // 'Kaedi':  getZonesGeometry(5),
 // 'Kano':  getZonesGeometry(10),
 // 'Kiffa':  getZonesGeometry(20),
 // 'LakeChad':  getZonesGeometry(6),
 // 'Maiduguri':  getZonesGeometry(19),
 // 'Mopti':  getZonesGeometry(0),
 // 'MoptiRegion':  getZonesGeometry(17),
 // 'Niamey':  getZonesGeometry(8),
 // 'Ougadougou':  getZonesGeometry(12),
 // 'Pendjari':  getZonesGeometry(9),
 // 'Sankarani':  getZonesGeometry(7),
 // 'Segou':  getZonesGeometry(14),
 // 'Sokoto':  getZonesGeometry(11),
 // 'SokotoRegion':  getZonesGeometry(18),
 // 'Tahoua':  getZonesGeometry(21),
 // 'Tamale':  getZonesGeometry(13),
 // 'Tambacounda':  getZonesGeometry(1),
 // 'WestCoast':  getZonesGeometry(22),
 // 'Ziguinchor':  getZonesGeometry(4),
 // 'Di': getZonesGeometry([547,548,549,567,568,569,587,588,589])
 'Selingue': getZonesGeometry([343,344,345,363,364,365,383,384,385])
}

// var caseStudies = {
//  // 'Bamako': getZonesGeometry(5),
//  // 'Baoule': getZonesGeometry(18),
//  // 'BoboDioulasso': getZonesGeometry(9),
//  // 'Dabola': getZonesGeometry(3),
//  // 'Kaedi': getZonesGeometry(2),
//  // 'Kano': getZonesGeometry(14),
//  // 'Kiffa': getZonesGeometry(17),
//  // 'LakeChad': getZonesGeometry(15),
//  // 'Maiduguri': getZonesGeometry(22),
//  // 'Mopti': getZonesGeometry(19),
//  // 'Niamey': getZonesGeometry(12),
//  // 'Ouagadougou': getZonesGeometry(8),
//  // 'Pendjari': getZonesGeometry(11),
//  // 'Sankarani': getZonesGeometry(4),
//  // 'Segou': getZonesGeometry(6),
//  // 'Sokoto': getZonesGeometry(21),
//  // 'Tahoua': getZonesGeometry(20),
//  // 'Tamale': getZonesGeometry(10),
//  // 'Tambacounda': getZonesGeometry(1),
//  // 'WestCoast': getZonesGeometry(16),
//  'Ziguinchor': getZonesGeometry(0)
// }
// // Define Case Studies
// var caseStudies = {
//     "Ziguinchor": getZonesGeometry([47]),
//     // "Malanta": getZonesGeometry([144, 145]),
//     // "Niokolo-Koba": getZonesGeometry([207]),
//     // "Néma": getZonesGeometry([415]),
//     // "Mopti": getZonesGeometry([530, 531, 532, 510, 511, 512]),
//     // "Seno Plain": getZonesGeometry([550, 549, 570, 569]),
//     // "Maro": getZonesGeometry([544, 545]),
//     // "Barsalogho": getZonesGeometry([648, 649]),
//     // "Niamey": getZonesGeometry([788, 789]),
//     // "Maradi": getZonesGeometry([1048, 1049]),
// }
// Define years
var yearsOfInterest = [
  2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012,
  2013,
  2014, 2015,
  2016
]
var scoringYears = [2000, 2013]

// Path to EE assets
var classifyDirectory = 'users/svangordon/2928210/classify/';
var prob_difDirectory = 'users/svangordon/2928210/prob_dif/';
var atlas2013 = 'users/svangordon/walt2013'

var atlasRawClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,78]
var atlasWkt = "PROJCS[\"SWA_LambertAzimuthal_Equal_Area\", \n  GEOGCS[\"WGS 84\", \n    DATUM[\"WGS_1984\", \n      SPHEROID[\"WGS 84\", 6378137.0, 298.257223563, AUTHORITY[\"EPSG\",\"7030\"]], \n      AUTHORITY[\"EPSG\",\"6326\"]], \n    PRIMEM[\"Greenwich\", 0.0], \n    UNIT[\"degree\", 0.017453292519943295], \n    AXIS[\"Longitude\", EAST], \n    AXIS[\"Latitude\", NORTH], \n    AUTHORITY[\"EPSG\",\"4326\"]], \n  PROJECTION[\"Lambert_Azimuthal_Equal_Area\"], \n  PARAMETER[\"latitude_of_center\", 11.0], \n  PARAMETER[\"longitude_of_center\", 3.0], \n  PARAMETER[\"false_easting\", 0.0], \n  PARAMETER[\"false_northing\", 0.0], \n  UNIT[\"m\", 1.0], \n  AXIS[\"x\", EAST], \n  AXIS[\"y\", NORTH]]"
// For some reason, this doesn't work. Why? I don't effing know.
// var atlasProjection = ee.Projection(atlasWkt)

// Full dataset
var regionalGeometry = ee.Geometry.Rectangle([
  -17.5425,      // xMin
  9,        // yMin
  18.883107,  // xMax
  18.417,     // yMax
], null, false)

// var classNames = [  "Forest",  "Savanna",  "Floodplain",  "Steppe",  "Plantation",  "Mangrove",  "Agriculture",  "Water",  "Sandy area",  "Rocky land",  "Bare soil",  "Settlements",  "Irrigated ag.",  "Gallery for.",  "Degraded for.",  "Bowe",  "Thicket",  "Recession ag.",  "Woodland",  "Ag./oil palms",  "Swamp for.",  "Short grass",  "Herbaceous sav.",  "Open mine"]
var classNames = [  "Forest",  "Savanna",  "Floodplain",  "Steppe",  "Plantation",  "Mangrove",  "Agriculture",  "Water",  "Sandy area",  "Rocky land",  "Bare soil",  "Settlements",  "Irrigated ag",  "Gallery for",  "Degraded for",  "Bowe",  "Thicket",  "Recession ag",  "Woodland",  "Ag oil palms",  "Swamp for",  "Short grass",  "Herbaceous sav",  "Open mine"]


var atlasPalette = [
  "#8400a8",
  "#8bad8b",
  "#000080",
  "#ffcc99",
  "#808000",
  "#33cccc",
  "#ffff96",
  "#3366ff",
  "#ff99cc",
  "#969696",
  "#a87000",
  "#ff0000",
  "#ccff66",
  "#a95ce6",
  "#d296e6",
  "#a83800",
  "#f5a27a",
  "#ebc961",
  "#28734b",
  "#ebdf73",
  "#beffa6", // Don't include oil palm
  "#a6c28c",
  "#0a9696",
  "#749373",
  "#505050"
]

// Takes a list of zone id's and returns the geometries dissolved into a MultiPolygon
function getZonesGeometry(geometry) {
  if (typeof geometry === 'number') {
    var geometryBound = ee.Geometry(require('users/svangordon/west-africa-lulc:caseStudyGeometries')[geometry])
      .bounds()
      .buffer(-10000)
    var resultingGeometry = ee.FeatureCollection(zoneGeometries).filterBounds(geometryBound).geometry().dissolve().bounds()
    return resultingGeometry
  }
  return ee.Geometry.MultiPolygon({
    coords: geometry.map(function(zoneId) {return zoneGeometries[zoneId]}),
    geodesic: true
  })
  .dissolve()


}


// Returns an ImageCollection of the composited and masked classify images
function getThresholdedClassificationImages(changeThreshold) {
  // var changeThreshold = 0.30

  var waoVis = {min:1, max:25, palette: [
    "8400a8",
    "8bad8b",
    "000080",
    "ffcc99",
    "808000",
    "33cccc",
    "ffff96",
    "3366ff",
    "ff99cc",
    "969696",
    "a87000",
    "ff0000",
    "ccff66",
    "a95ce6",
    "d296e6",
    "a83800",
    "f5a27a",
    "ebc961",
    "28734b",
    "ebdf73",
    "beffa6", // Don't include oil palm
    "a6c28c",
    "0a9696",
    "749373",
    "505050"
  ]};


  // var classifyDirectory = 'users/svangordon/2928210/classify/';
  // var prob_difDirectory = 'users/svangordon/2928210/prob_dif/';
  var imageFootprint = ee.Image(prob_difDirectory + 2000 ).get('system:footprint')
  // print(imageFootprint)
  var classifyCollection = []
  var classifyWithConfidenceCollection = []
  // var prob_difCollection = []
  for (var year = 2000; year < 2017; year++) {

    var difImage = ee.Image(prob_difDirectory + year ).unitScale(0, 10000)
    var mask = difImage.gt(changeThreshold)

    var classifiedImage = ee.Image(classifyDirectory + year)/*.remap(
        atlasRawClasses, // Map from
        ee.List.sequence(1,24) // Map to
      )*/
      .updateMask(mask)
      .rename('land_cover')

    var classifyWithConfidenceImage = ee.Image(classifyDirectory + year)
      .rename('land_cover')
      .addBands(difImage.rename('confidence'))

    // Map.addLayer(ee.Image(classifiedImage), waoVis, "classify " + year)
    classifyCollection.push(classifiedImage)
    classifyWithConfidenceCollection.push(classifyWithConfidenceImage)
  }
  // Create an image where each pixel is the classification with the highest
  // probability difference.
  var highestConfidenceImage = ee.ImageCollection(classifyWithConfidenceCollection)
    .qualityMosaic('confidence')
    .select('land_cover')
  // var highestConfidenceImage = ee.ImageCollection(classifyCollection)
  //   .mode()
  //   .rename('land_cover')
  var backstopImage = ee.ImageCollection(classifyCollection)
    .reduce(ee.Reducer.firstNonNull())
    .rename('land_cover')
  // In any spots where we don't have a pixel that meets the confidence thershold,
  // instead use the pixel with the highest probability difference
  backstopImage = ee.ImageCollection([backstopImage, highestConfidenceImage])
    .mosaic()
  classifyCollection[0] = backstopImage

  // Go over the images, starting at the end, get them composited with .first
  var compositedCollection = []
  for (var i = classifyCollection.length; i > 0; i--) {
    var compositedImage = ee.ImageCollection(classifyCollection.slice(0, i))
      .reduce(ee.Reducer.lastNonNull())
      .set('system:footprint', imageFootprint)
    // Map.addLayer(compositedImage, waoVis, 1999 + i)
    // Add the images so that the most recent one, 2000, is first
    compositedCollection.unshift(compositedImage)
  }

  // var volatility = ee.ImageCollection(compositedCollection)
  //   .reduce(ee.Reducer.countDistinct())

  // Map.addLayer(volatility, volatilityVis, 'num classes present at pixel')


  var changeImages = []
  compositedCollection.reduce(function(previousImage, currentImage) {
    var changeImage = previousImage.eq(currentImage).bitwiseNot()
    changeImages.push(changeImage)
    return currentImage
  })


  var changeCollection = ee.ImageCollection(changeImages)

  var countImage = changeCollection.count()
  // Map.addLayer(countImage, {min:0, max:17}, 'countImage')

  var changeImage = changeCollection.sum()

  // Map.addLayer(changeImage, volatilityVis, 'num of times pixel changed class, threshold: ' + changeThreshold)

  var percentChange = changeImage.divide(countImage)

  // Map.addLayer(percentChange, {min: 0, max: 1, palette: ['001137','0aab1e','e7eb05','ff4a2d','e90000']}, 'num of times pixel changed class, normalized')
  return compositedCollection
}

// Returns an ImageCollection of the composited and masked classify images
function getConversionVolatility(changeThreshold) {
  var compositedCollection = getThresholdedClassificationImages(changeThreshold)
  var changeImages = []
  compositedCollection.reduce(function(previousImage, currentImage) {
    var changeImage = previousImage.eq(currentImage).bitwiseNot()
    changeImages.push(changeImage)
    return currentImage
  })

  var changeCollection = ee.ImageCollection(changeImages)

  var countImage = changeCollection.count()
  // Map.addLayer(countImage, {min:0, max:17}, 'countImage')

  var changeImage = changeCollection.sum()

  return changeImage
}

// Get the conversion volatility by class
function getAggregateConversionVolatility(changeThreshold) {
  var compositedCollection = getThresholdedClassificationImages(changeThreshold)
  var changeImages = []
  compositedCollection.reduce(function(previousImage, currentImage) {
    var changeImage = previousImage.eq(currentImage).bitwiseNot()
    changeImages.push(changeImage)
    return currentImage
  })

  // Mask all of the images based on whether or not they changed. changeImages
  // becomes a collection of masks.
  print('compositedCollection.size', compositedCollection.length)
  print('changeImages.size', changeImages.length)

  var changeStates = []
  changeImages.forEach(function(changeMask, index) {
    var imageBefore = ee.Image(compositedCollection[index]).updateMask(changeMask)
    var imageAfter = ee.Image(compositedCollection[index + 1]).updateMask(changeMask)
    var data = imageBefore.reduceRegion({
          reducer: ee.Reducer.frequencyHistogram().unweighted(),
          maxPixels: 7029559832,
          geometry: regionalGeometry,
          scale: 30
        }).get('b1')
    changeStates.push(ee.Feature(null, data))
    // data = imageAfter.reduceRegion({
    //       reducer: ee.Reducer.frequencyHistogram().unweighted(),
    //       maxPixels: 7029559832,
    //       geometry: regionalGeometry,
    //       scale: 30
    //     }).get('b1')
    //   changeStates.push(ee.Feature(null, data))
  })
  print('changeStates', ee.FeatureCollection(changeStates[0]).flatten())

  Export.table.toDrive({
    collection: ee.FeatureCollection(changeStates[0]).flatten(),
    folder: 'AggregateConversionVolatility',
    // fileNamePrefix: name + 'ClassificationAgreement',
    fileFormat: "CSV",
    description: 'AggregateConversionVolatility'
  });
  // var changeCollection = ee.ImageCollection(changeImages)
}

function renderConversionVolatility(image, suffix) {
  // var volatility = getConversionVolatility(threshold)
  var volatilityVis = {min: 1, max: 17, palette: ['001137','0aab1e','e7eb05','ff4a2d','e90000']}
  Map.addLayer(image, volatilityVis, "Conversion Volatility " + suffix)
}

function renderClassification(image, year) {
  // print('rendering classification', year)
  var classificationVis = {
    min:1, max:25, bands: ['remapped'], format: 'png',
    palette: [
      "8400a8",
      "8bad8b",
      "000080",
      "ffcc99",
      "808000",
      "33cccc",
      "ffff96",
      "3366ff",
      "ff99cc",
      "969696",
      "a87000",
      "ff0000",
      "ccff66",
      "a95ce6",
      "d296e6",
      "a83800",
      "f5a27a",
      "ebc961",
      "28734b",
      "ebdf73",
      "beffa6", // Don't include oil palm
      "a6c28c",
      "0a9696",
      "749373",
      "505050",
  ]
};
  image = image.addBands(image.remap(atlasRawClasses, ee.List.sequence(1, atlasRawClasses.length)))
  Map.addLayer(image, classificationVis, 'Classification' + ' ' + year)
  // Map.addLayer(visualizeClassification(image), {}, 'Classification' + ' ' + year)
}

function visualizeClassification(image) {
  return image
    .remap(atlasRawClasses, ee.List.sequence(1, atlasRawClasses.length))
    .visualize({min:1, max:25, bands:['remapped'], palette: [
        "8400a8",
        "8bad8b",
        "000080",
        "ffcc99",
        "808000",
        "33cccc",
        "ffff96",
        "3366ff",
        "ff99cc",
        "969696",
        "a87000",
        "ff0000",
        "ccff66",
        "a95ce6",
        "d296e6",
        "a83800",
        "f5a27a",
        "ebc961",
        "28734b",
        "ebdf73",
        "beffa6", // Don't include oil palm
        "a6c28c",
        "0a9696",
        "749373",
        "505050"
      ]})
}

function getThresholdedClassificationImage(year, changeThreshold) {
  var collection = getThresholdedClassificationImages(changeThreshold);
  return ee.ImageCollection(collection)
    .toList(1, year - 2000)
    .get(0)
}

function getCenterPoints(geometry) {
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    // .clip(geometry)
    // .reproject({
    //   crs:ee.Image('users/svangordon/walt2013').projection(),
    //   scale:2000
    // })
    // .aside(function(image) {Map.addLayer(image, {min:0, max:100000}, 'random')})
    .reduceToVectors({
      crs: ee.Image('users/svangordon/walt2013').projection(),
      geometry: geometry,
      scale: 2000
    })
    // .aside(function(image) {
    //   Map.addLayer(image, {min:0, max:100000}, 'random')
    //   Map.addLayer(ee.Image('users/svangordon/walt2013').randomVisualizer())
    // })
    .map(function(feature) {
      var centroid = feature.centroid(10)
      return centroid
    })
}

// function getCaseStudyGeometry(caseStudy, caseStudies) {
//   var geoms = caseStudies[caseStudy]
//     .map(function(zone) { return geometries[zone] })
//   geoms = ee.Geometry.MultiPolygon(geoms).dissolve()
//   return geoms
// }

// function getCaseStudyCenterpoints(caseStudies) {
//   var centerpoints = []
//   for (var caseStudy in caseStudies) {
//     var geoms = caseStudies[caseStudy]
//       .map(function(zone) { return geometries[zone] })
//     geoms = ee.Geometry.MultiPolygon(geoms).dissolve()
//     // print('caseStudy', caseStudy, 'geoms', geoms)
//     centerpoints.push(ee.FeatureCollection(geoms).map(getCenterPoints))
//   }
//   return ee.FeatureCollection(centerpoints).flatten().flatten()
// }

function getAgreementImage(year, changeThreshold) {
  var compositedCollection = getThresholdedClassificationImages(changeThreshold)
  var vgImage = ee.ImageCollection(compositedCollection)
    .toList(1, year - 2000)
    .get(0)
  vgImage = ee.Image(vgImage)
    .unmask(99)
    // .set('system:footprint')
    // .unmask(25)
  // print(vgImage)
  // renderClassification(vgImage, year)
  vgImage = ee.Image(vgImage)
    .rename('vg_landcover')
  // print('vg', vgImage)
  var atlasImage = ee.Image('users/svangordon/walt' + year)
    // .remap([1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,78], [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24])
    .rename('atlas_landcover')
  // print(atlasImage)
  var agreementImage = atlasImage.addBands(vgImage)
  return agreementImage
  // Map.addLayer(agreementImage)
  // print('agreementImage', agreementImage)
}

function getCaseStudyAgreement(caseStudyName, caseStudyGeometry, year, threshold) {
  var centerpoints = getCenterPoints(caseStudyGeometry);
  var agreementImage = getAgreementImage(year, threshold)
  // print('agreementImage', agreementImage)
  var accFc = agreementImage.sampleRegions({
    collection: centerpoints,
    scale: 30
  });
  return accFc
}

function renderAgreementChart(accFc, caseStudyName, year) {
  var errorMatrix = accFc.errorMatrix('atlas_landcover', 'vg_landcover', atlasRawClasses)
  var atlasClasses = accFc.aggregate_histogram('atlas_landcover')
  var vgClasses = accFc.aggregate_histogram('vg_landcover')
  var producersAccuracy = errorMatrix.producersAccuracy()

  var simpleChart = ui.Chart.array.values(producersAccuracy, 0, classNames)
    .setChartType('Table')
    .setOptions({
      title: caseStudyName
    })
  var accuracy = errorMatrix.accuracy()
  print(simpleChart, caseStudyName + " " + year + ' Agreement: ', accuracy)
}

// function getAgreement(caseStudies, year, threshold) {
//   var classNames = [  "Forest",  "Savanna",  "Floodplain",  "Steppe",  "Plantation",  "Mangrove",  "Agriculture",  "Water",  "Sandy area",  "Rocky land",  "Bare soil",  "Settlements",  "Irrigated ag.",  "Gallery for.",  "Degraded for.",  "Bowe",  "Thicket",  "Recession ag.",  "Woodland",  "Ag./oil palms",  "Swamp for.",  "Short grass",  "Herbaceous sav.",  "Open mine"]
//   var centerpoints = getCaseStudyCenterpoints(caseStudies);
//   var agreementImage = getAgreementImage(2013, 0.1)
//   // print('agreementImage', agreementImage)
//   var accFc = agreementImage.sampleRegions({
//     collection: centerpoints,
//     scale: 30
//   });
//
//   // print(accFc.first())
//   // var errorMatrix = accFc.errorMatrix('atlas_landcover', 'vg_landcover', ee.List.sequence(1, 25))
//   var errorMatrix = accFc.errorMatrix('atlas_landcover', 'vg_landcover', atlasRawClasses)
//   var atlasClasses = accFc.aggregate_histogram('atlas_landcover')
//   var vgClasses = accFc.aggregate_histogram('vg_landcover')
//   var producersAccuracy = errorMatrix.producersAccuracy()
//   print('error matrix', errorMatrix)
//   print('producersAccuracy', producersAccuracy)
//
//   var simpleChart = ui.Chart.array.values(producersAccuracy, 0, classNames)
//     .setChartType('Table')
//   print(simpleChart)
//
//   var labelArray = ee.Array(classNames)
//   print('labelArray', labelArray)
//   var accArray = ee.Array(producersAccuracy)
//   // var catted = ee.Array.cat([labelArray, accArray.slice(1)], 1)
//   // print('catted', catted)
//   // var accChart = ui.Chart(producersAccuracy, 'Table')
//   // print(accChart)
//   print('cf order', errorMatrix.order())
//   print('atlasClasses', atlasClasses)
//   print('vgClasses', vgClasses)
//   var accuracy = errorMatrix.accuracy()
//   print('accuracy', accuracy)
// }

function getPrecipitationImage(geometry, year) {
// function getMaps(geometry, geomName) {
  var annualMaps = []

  function formatDate(date) {
    return Number(date) * 20
  }
  var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY");
  var precipitation = chirps
    .filterBounds(geometry)
    .filterDate(year + "-01-01", year + "-12-31")
    .sum()
    .clip(geometry)
    .set('system:time_start', ee.Date(year+'-01-01'))
  return precipitation
}

function renderPrecipitation(image, year) {
  var precipitationVis = {min:0, max: 4500, palette: ['001137','0aab1e','e7eb05','ff4a2d','e90000']}
  Map.addLayer(image, precipitationVis, 'Precipitation ' + year)
}

// getAgreement(caseStudies, 2013, 0.1)


/*
  Region: Display
*/

var caseStudyGeometries = Object.keys(caseStudies)
  .map(function(caseStudyName) {
    return caseStudies[caseStudyName]
    // return getCaseStudyGeometry(caseStudyName, caseStudies)
  })

var combinedGeometry = ee.Geometry.MultiPolygon({
  coords: caseStudyGeometries,
  geodesic: true,
  maxError: 30
})


function displayZonesGrid() {
  Map.addLayer(ee.FeatureCollection(zoneGeometries), {}, 'Zone Grid')
}


function displayRegionalClassification () {
    yearsOfInterest.forEach(function(year) {
      var classifyImage = getThresholdedClassificationImage(year, confidenceThreshold)
      classifyImage = ee.Image(classifyImage).clip(regionalGeometry)
      renderClassification(classifyImage, "Regional " + year)
    })
}

function displayVolatility() {
  var volatilityImage = getConversionVolatility(confidenceThreshold).clip(combinedGeometry)
  renderConversionVolatility(volatilityImage, 'Case Study')
}

function displayRegionalVolatility () {
  var volatilityImage = getConversionVolatility(confidenceThreshold).clip(regionalGeometry)
  renderConversionVolatility(volatilityImage, "Regional")
}

function displayPrecipitation() {
  yearsOfInterest.forEach(function(year) {
    var precipitationImage = getPrecipitationImage(combinedGeometry, year)
    renderPrecipitation(precipitationImage, year)
  })
}

function displayPrecipTimeSeries () {
  Object.keys(caseStudies).forEach(function(caseStudyName) {
    // var caseStudyGeometry = getCaseStudyGeometry(caseStudyName, caseStudies)
    var caseStudyGeometry = caseStudies[caseStudyName]
    var precipImages = yearsOfInterest.map(function(year) {
      return getPrecipitationImage(caseStudyGeometry, year)
    })
    precipImages = ee.ImageCollection(precipImages)
    var rainfallChart = ui.Chart.image.series({
      imageCollection: precipImages,
      region:  ee.Geometry(caseStudyGeometry),
      scale: ee.Image(precipImages.first()).projection().nominalScale()
    })
    .setOptions({
      title: caseStudyName + " Precipitation",
      vAxis: {
        title: 'mm/day (CHIRPS)'
      }
    });
    print(rainfallChart)
  })
}

function displayPrecipAnomaly() {
  var precipByYear = yearsOfInterest.map(function(year) {
    var precipitationImage = getPrecipitationImage(regionalGeometry, year)
    return precipitationImage
      .reduceRegion({
        reducer: ee.Reducer.mean(),
        region: regionalGeometry
      })
  })
  print('precip by year', precipByYear)
}

function mapDictCountsToArea(key, pixelCount) {
  return ee.Number(pixelCount).multiply(0.0009)
}

function displayClassCountTimeSeries () {
  Object.keys(caseStudies).forEach(function(caseStudyName) {
    // var caseStudyGeometry = getCaseStudyGeometry(caseStudyName, caseStudies)
    var caseStudyGeometry = caseStudies[caseStudyName]
    var classifyImages = yearsOfInterest.map(function(year) {
      var classifyImage = getThresholdedClassificationImage(year, confidenceThreshold)
      return ee.Image(classifyImage)
        .clip(combinedGeometry)
        // .set('year', year)
      return classifyImage
    })
    classifyImages = ee.ImageCollection(classifyImages)
    var foo = ee.Image(classifyImages.first()).reduceRegion({
            reducer: ee.Reducer.frequencyHistogram().unweighted(),
            maxPixels: 7029559832,
            geometry: caseStudyGeometry,
            scale: 30
          })
    var bar = foo.get(foo.keys().get(0))
    bar = ee.Feature(null, bar)
    // print(
    // 'bar', bar
    // )
    var classCounts = classifyImages.map(function(image) {
      var dict = ee.Image(image).reduceRegion({
        reducer: ee.Reducer.frequencyHistogram().unweighted(),
        maxPixels: 7029559832,
        geometry: caseStudyGeometry,
        scale: 30
      })
      dict = ee.Dictionary(dict
        .get(dict.keys().get(0)))
        .remove(['null'], true)
        .map(mapDictCountsToArea)
      // var sortedKeys = dict
      //   .keys()
      //   .map(function(key) {
      //     return ee.Number.parse(key)
      //   })
      //   .sort()
      //   .map(function(key) {
      //     return ee.String(key)
      //   })
      return ee.Feature(null, dict)
        // .select(sortedKeys)
        // .set('date', image.get('system:time_start'))
    })
    // print('class counts', classCounts)

    var zoneClassIds = ee.Feature(classCounts.first())
      .propertyNames()
      .remove('system:index')
      .sort()
    var zoneClassNames = zoneClassIds
      .map(function(classId) {
        return ee.List(classNames).get( ee.List(atlasRawClasses).indexOf( ee.Number.parse(classId)))
      })
    var zoneNameMap = ee.Dictionary.fromLists(zoneClassIds, zoneClassNames)
    // Set the features property names to the zone class names
    // print(ee.Feature(classCounts.first()).toDictionary())
    classCounts = classCounts.map(function(feature) {
      var index = ee.Number.parse(ee.Feature(feature).get('system:index'))
      var year = index.add(2000)
      return feature.set('year', ee.String(year))
      // var dict = ee.Feature(feature).toDictionary()
      // return dict
      // dict = dict.rename(zoneClassIds, zoneClassNames)
      // return ee.Feature(null, dict)
    })
    // print('remapped classCounts', classCounts)
    var zoneClassColors = zoneClassIds
      .map(function(classId) {
        return ee.List(atlasPalette).get( ee.List(atlasRawClasses).indexOf( ee.Number.parse(classId)))
      })

    // print('zoneClassIds', zoneClassIds)
    // print('zoneClassNames', zoneClassNames)
    // print('zoneClassColors', zoneClassColors)

    // Non-blocking way
    zoneClassColors.evaluate(function(colors) {
      print(caseStudyName,zoneNameMap, colors)
      var chart = ui.Chart.feature.byFeature(classCounts, 'year')
        .setOptions({
          colors: colors,
          title: caseStudyName + " Class Counts",
          vAxis: {
            title: 'km^2'
          }
        })
        .setSeriesNames(zoneNameMap)

      var chartZoomed = ui.Chart.feature.byFeature(classCounts, 'year')
        .setOptions({
          colors: colors,
          title: caseStudyName + " Class Counts",
          vAxis: {
            title: 'km^2',
            viewWindow: {max: 500, min: 0}
          }
        })
        .setSeriesNames(zoneNameMap)

      print(chart)
      print(chartZoomed)
    })

    // Blocking way
    // zoneClassColors.evaluate(function(colors) {
      // var chart = ui.Chart.feature.byFeature(classCounts, 'year')
      //   .setOptions({
      //     colors: zoneClassColors.getInfo(),
      //     title: caseStudyName + " Class Counts",
      //     vAxis: {
      //       title: 'km^2'
      //     }
      //   })
      //   .setSeriesNames(zoneNameMap.getInfo())
      //
      // print(chart)
    // })

    // var chart = ui.Chart.feature.byFeature(classCounts, 'year')
    //   .setOptions({
    //     colors: zoneClassColors//.getInfo()
    //   })
    //   .setSeriesNames(zoneNameMap)
    //
    // print(chart)
    // var rainfallChart = ui.Chart.image.series({
    //   imageCollection: precipImages,
    //   region:  ee.Geometry(caseStudyGeometry),
    //   scale: ee.Image(precipImages.first()).projection().nominalScale()
    // })
    // .setOptions({
    //   title: caseStudyName
    // });
    // print(rainfallChart)
  })
}

function displayClassificationReports () {
  Object.keys(caseStudies).forEach(function(caseStudyName) {
    // var caseStudyGeometry = getCaseStudyGeometry(caseStudyName, caseStudies)
    var caseStudyGeometry = caseStudies[caseStudyName]
    var accFc = scoringYears.reduce(function(accum, year) {
      var annualAgreement = getCaseStudyAgreement(caseStudyName, caseStudyGeometry, year, confidenceThreshold)
      return ee.FeatureCollection(accum).merge(annualAgreement)
    }, ee.FeatureCollection([]))
    renderAgreementChart(accFc, caseStudyName, 'Combined')
  })
}

/*
  End Display
*/

function exportClassification(exportType) {
  var exportGeometries = caseStudyGeometries.slice()
  exportGeometries.push(regionalGeometry)
  var exportNames = Object.keys(caseStudies)
  exportNames.push('Region')
  var exportCollections = {}
  exportNames.forEach(function(exportName, index) {
    var exportCollection = []
    var exportGeometry = exportGeometries[index]
    yearsOfInterest.forEach(function(year) {
      if (exportName === 'Region') {
        var scale = 1000;
      } else {
        var scale = 30
      }
      var classifyImage = getThresholdedClassificationImage(year, confidenceThreshold)
      classifyImage = ee.Image(classifyImage).clip(exportGeometry)
      var visualizedImage = visualizeClassification(classifyImage)
      exportCollection.push(visualizedImage)
      // renderClassification(classifyImage, exportName + ' ' + year)
      if (exportType === 'image') {
        Export.image.toDrive({
          image: visualizedImage,
          description: 'classify' + exportName + year,
          folder: 'classifyImages',
          region: exportGeometry,
          crs: 'EPSG:3857',
          maxPixels: 1e10,
          scale: scale
        })
      }
    })
    if (exportType === 'video') {
      if (exportName === 'Region'){
        var dimensions = '2920x800'
      } else {
        var dimensions = 1024
      }
      Export.video.toDrive({
        collection: ee.ImageCollection(exportCollection),
        description: 'classifyVideo' + exportName,
        folder: 'classifyVideos',
        framesPerSecond: 1.5,
        region: exportGeometry,
        crs: 'EPSG:3857',
        maxPixels: 1e10,
        // scale: 30,
        dimensions: dimensions
      })
    }
  })
}

function exportConversionVolatility() {
  var exportGeometries = caseStudyGeometries.slice()
  exportGeometries.push(regionalGeometry)
  var exportNames = Object.keys(caseStudies)
  exportNames.push('Region')
  exportNames.forEach(function(exportName, index) {
    var exportGeometry = exportGeometries[index]
    var thresholds = [0.1, 0.2, 0.3]
    thresholds.forEach(function(threshold) {
      // if (exportName === 'Region') {
      //   var scale = 1000;
      // } else {
      //   var scale = 30
      // }
      var scale = 30
      var volatility = getConversionVolatility(threshold);
      var volatilityVis = {min: 1, max: 17, palette: ['001137','0aab1e','e7eb05','ff4a2d','e90000']}
      renderConversionVolatility(volatility, 'Volatility '+ exportName)
      var visualizedImage = ee.Image(volatility).visualize(volatilityVis)
      Export.image.toDrive({
        image: visualizedImage,
        description: exportName + '_volatility_' + (threshold * 10),
        fileNamePrefix: exportName + ' Normalized Conversion Volatility Threshold 0' + (threshold * 10),
        folder: 'conversionVolatility',
        region: exportGeometry,
        crs: 'EPSG:3857',
        maxPixels: 1e10,
        scale: scale
      })
    })
  })
}

main()

var ecowas = ee.FeatureCollection('users/svangordon/ecowas')
ecowas = ecowas.geometry().coordinates()
  .map(function(coords) {
    return ee.Algorithms.GeometryConstructors.MultiLineString(coords)
  })
ecowas = ee.Algorithms.GeometryConstructors.MultiGeometry(ecowas)
print(ecowas)
// ecowas = ee.Geometry.MultiLineString(ecowas)

Map.addLayer(ecowas, {color: 'red'}, 'ecowas boundaries')

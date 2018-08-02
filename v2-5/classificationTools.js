// This path is going to be 'users/svangordon/default:classificationTools'

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
exports.displayClassification = displayClassification

/*
  getAtlasGeometries
    Create a collection of ~~center~~points at a given projection. Used for creating
  the collection from which we will sample our basemap.

  Parameters:
    - zoneGeometry (ee.Geometry): The geometry within which we will create our collection of points.
    - [projectionImage] (ee.Image, default: Atlas 2013): The image whose projection
    we will use for the collection of points.
  Returns:
    ee.FeatureCollection (GeometryCollection)

*/
function getAtlasGeometries(zoneGeometry, geometryType, labelProjection) {
  labelProjection = labelProjection.projection()
  zoneGeometry = ee.FeatureCollection(zoneGeometry).geometry()
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: labelProjection,
      geometry: zoneGeometry,
      // scale: labelProjection.nominalScale(),
      geometryInNativeProjection: true,
      geometryType: geometryType
    })
    // .map(function(feature) {
    //   var centroid = feature.centroid(5, labelProjection)
    //   return centroid
    // })
}
exports.getAtlasGeometries = getAtlasGeometries

/*
  toPoint
    Takes a feature with `longitude` and `latitude` properties, strips those properties,
  and converts them into a geometry. Used so that features have geometries after a
  `.sampleRegions` call.
*/
function toPoint(feature) {
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}
exports.toPoint = toPoint

/*
  TimeFilter
    In an effort to simplify things, this now only takes months. You give it a

*/
function TimeFilter(startDateList, endDateList, yearsList) {
  // Assign default years list value
  yearsList = ee.List(yearsList || [-1, 1])
  // Cast start and end date lists
  startDateList = ee.List(startDateList)
  endDateList = ee.List(endDateList)

  var startMonth = startDateList.get(0)
  var startDay = startDateList.get(1)
  var startDoy = ee.Date.fromYMD(1, startMonth, startDay)
    .getRelative('day', 'year')
    .add(1)
  var startYearOffset = yearsList.get(0)
  // print('startDoy', startDoy)

  var endMonth = endDateList.get(0)
  var endDay = endDateList.get(1)
  var endDoy = ee.Date.fromYMD(1, endMonth, endDay)
    .getRelative('day', 'year')
    .add(1)
  var endYearOffset = yearsList.get(1)

  // datesArray = ee.List(datesArray || [9, 15, 11, 15])
  // var startMonth = datesArray.get(0)
  // var startDay = datesArray.get(1)
  // var endMonth = datesArray.get(2)
  // var endDay = datesArray.get(3)
  // startDate = ee.Date(startDate)
  // endDate = ee.Date(endDate)
  function getTimeFilter(originYear) {
    originYear = ee.Number(originYear)
    var startYear = originYear.add(startYearOffset)
    var endYear = originYear.add(endYearOffset)
    // var filters = ee.List.sequence(startYear, endYear).map(function(filterYear) {
    //
    // })
    //
    //
    // var startDate = ee.Date.fromYMD(startYear, startMonth, startDay)
    // var endDate = ee.Date.fromYMD(endYear, endMonth, endDay)
    // var filterRange = ee.Filter.date()
    return ee.Filter.and(
      // ee.Filter.calendarRange(startMonth, endMonth, 'month'),
      ee.Filter.calendarRange(startDoy, endDoy, 'day_of_year'),
      ee.Filter.calendarRange(startYear, endYear, 'year')
    )

    var dateFilters = yearsList.map(function(filterYearOffset) {
      var startDate = ee.Date.fromYMD(ee.Number(originYear).add(filterYearOffset).add(startYearOffset), startMonth, startDay)
      var endDate = ee.Date.fromYMD(ee.Number(originYear).add(filterYearOffset).add(endYearOffset), endMonth, endDay)
      return ee.Filter.date(startDate, endDate)
    })
    return dateFilters.slice(1)
      .iterate(function(filter, accum) {
        return ee.Filter.or(accum, filter)
      }, dateFilters.get(0))
  }
  return getTimeFilter
}
exports.TimeFilter = TimeFilter
var timeFilter = TimeFilter([9, 15], [11, 15])
print(timeFilter)
print(timeFilter(2013))
var filter = timeFilter(2013)
var imageCollection = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY");
var ls7 = ee.ImageCollection("LANDSAT/LE07/C01/T1_RT");
print(imageCollection.filter(filter))

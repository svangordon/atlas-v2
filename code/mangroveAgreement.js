var studyArea = /* color: #d63000 */ee.Geometry.MultiPolygon(
        [[[[-16.938593316471042, 14.232506503361504],
           [-16.982533506196773, 12.06078091388033],
           [-16.268391954979734, 10.671324230923572],
           [-15.653134931334876, 11.092101031290502],
           [-15.125768058151834, 12.178941798788],
           [-15.224644230757235, 13.891463690686397]]],
         [[[-14.91943359375, 13.496055463328892],
           [-13.24951171875, 8.015291037095308],
           [-4.85595703125, 10.119879155660328],
           [-7.6025390625, 14.050914430568472]]]]);

var atlasV2_2000 = ee.Image('users/svangordon/conference/atlas_v2/classify/2013')

var hansen = ee.Image('UMD/hansen/global_forest_change_2017_v1_5')

var hansenVis = {min: 0, max:100, bands: "treecover2000", palette: "3d3d3d,080a02,080a02,080a02,106e12,37a930,03ff17"}

// Map.addLayer(hansen, hansenVis)

var mangroveLandsat = ee.ImageCollection('LANDSAT/MANGROVE_FORESTS')
mangroveLandsat = ee.Image(mangroveLandsat.first()).unmask()

var mangroveLandsatVis = {
  eeObject: mangroveLandsat.selfMask(),
  visParams: {min: 0, max: 1, palette: "d40115"},
  name: "Mangrove Landsat"
}

print('mangroveLandsat', mangroveLandsat)

Map.addLayer(mangroveLandsatVis)

var mangroveAtlas = atlasV2_2000.eq(7).clip(studyArea)

print('mangroveAtlas', mangroveAtlas)
// var mangroveAtlasVis = {
//   eeObject: mangroveAtlas,
//   visParams: {min: 0, max: 1, palette: "33cccc"},
//   name: "Mangrove Atlas"
// }
var mangroveAtlasVis = {min: 0, max: 1, palette: "33cccc"}

Map.addLayer(mangroveAtlas.selfMask(), mangroveAtlasVis, "Mangrove Atlas")

var agreement = mangroveAtlas.eq(mangroveLandsat).clip(studyArea)
print(agreement)
var agreementPercentage = agreement.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: studyArea,
  scale: 30,
  maxPixels: 1e13
})

var bothMangrove = mangroveAtlas.and(mangroveLandsat)
var eitherMangrove = mangroveAtlas.or(mangroveLandsat)//.selfMask()
Map.addLayer(bothMangrove, {}, 'bothMangrove')
Map.addLayer(eitherMangrove.selfMask(), {palette: 'blue'}, 'eitherMangrove')

var mangroveOnlyAgreement = bothMangrove//.mask(eitherMangrove)
  .reduceRegion({
    geometry: studyArea,
    scale: 30,
    reducer: ee.Reducer.mean(),
    maxPixels: 1e13
  })
Map.addLayer(bothMangrove.mask(eitherMangrove), {palette: 'red'})
print('Mangrove-only agreement', mangroveOnlyAgreement.get('b1'))

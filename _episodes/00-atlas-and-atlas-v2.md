---
title: "Intro to Atlas and Atlas V2"
teaching: 5
exercises: 10
questions:
- What are Atlas and Atlas V2?
- What is the relationship between Atlas and Atlas V2?
- How was Atlas V2 produced?
- What are the temporal and spatial scales of these datasets?
objectives:
- Understand what the Atlas and Atlas V2 datasets are
- Understand how it is possible to go from 2km to 30m scale
keypoints:
- Atlas is a classification of Landsat pixels
- Atlas V2 uses the Atlas dataset as its labels
- The Atlas V2 process can be done with different labels and different features
- Atlas V2 is approximately as accurate as Atlas
---

The Atlas and Atlas V2 datasets are land cover maps of the West African Sahel. In this lesson, we will discuss these datasets, how they were produced, how they are related, and how you might use them in your map.

## Description of Datasets

We are going to be talking to you about the Atlas and Atlas V2 datasets.

## Atlas Dataset

<img src="../fig/01-atlas-2013.png" border="10" >
_2013 Atlas Classification_

The [West Africa Land Use Land Cover Time Series Atlas (Atlas)](https://eros.usgs.gov/westafrica/) is a land cover dataset produced by USGS, USAID, and CILSS. This land cover dataset was produced by experts in West Africa, who hand classified 1,200,000 pixels. The dataset is available at 2km resolution, and three maps are available: 1975, 2000, and 2013. Advantages of this dataset include its high reliability and its class system, which was chosen by researchers in the region and is suited to West Africa. Atlas classes are specific to West Africa; for example, in addition to classes like forest or settlement, there are classes like short grass savanna, bowe, steppe, etc. One disadvantage of this dataset is its coarse resolution (2km). It is also very time and labor intensive to produce; it takes a large number of researchers over a year to produce a land cover map for a year.

The Atlas dataset is available for download from the USGS website. [West Africa Land Use Land Cover Time Series Atlas (Atlas)](https://eros.usgs.gov/westafrica/)

### Atlas V2 Dataset
<img src="../fig/01-atlas-v2-2016.png" border="10" >
_2016 Atlas V2 Classification_

The Atlas V2 is a land cover dataset produced by Mollie Van Gordon at the University of California, Berkeley. This dataset uses the Atlas as training data to perform machine classification of satellite imagery. By using the Atlas data to train machine learning algorithms, we can produce land cover maps of the West Africa region that are of a similar accuracy as the Atlas dataset, but at a higher resolution. The dataset was produced using the Google Earth Engine cloud computing platform, which is freely available to the public. Because we used Earth Engine and publicly available datasets, we can create land cover maps at low or no cost, and annually.

Currently, the V2 team has produced a 30m land cover dataset using Landsat images for every year between 2000 and 2016. This dataset is currently available on Google Earth Engine. The process for creating these datasets is flexible. Different datasets can be used in place of both Landsat and Atlas. For example, researchers could use Sentinel imagery to produce a map at 20m resolution, or researchers could hand classify a small area of interest to produce a land cover map at an even higher accuracy.

Currently, not all of the region covered by Atlas is classified in Atlas V2. The southern coast of West Africa has been excluded, due to issues with finding cloud-free images. Southern Chad has also not been classified, due to issues with scale (in Atlas, Chad is at 4km resolution). Both of these omissions are due to time constraints: there's no reason that we couldn't classify the entire region, and in fact we're eager to. We just haven't had time yet!

## Viewing Datasets
We will talk more soon about how to view these datasets. For now, let's just look at them in Earth Engine.

A visualization of the dataset can be viewed in the script `users/svangordon/atelier/visualize2013`.

Let's take ten minutes to look around the data. Record some of your observations about the classification -- its accuracy, any artifacts, what it does well, or what it does not do well.

> ## Discussion
>
> * What are the differences between the Atlas and the AtlasV2 datasets?
> * What are some areas where the Atlas or AtlasV2 is doing well? Where does it not do so well?
> * In what ways might the AtlasV2 dataset be useful for your work?

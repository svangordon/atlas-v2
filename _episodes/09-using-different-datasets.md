---
title: "Improving Data Inputs"
teaching: 0
exercises: 0
questions:
- How do I create a time series for a given location?
- How can I plot that time series within Google Earth Engine?
- "How do I make that plot interactive?"
objectives:
- "Load high resolution crop imagery."
- "Dynamically select lat/longs for creating time series plots."
- "Create a time series of NDVI and EVI for a selected point."
keypoints:
- "Time series data can be extracted and plotted from Image Collections for points and regions."
- "GEE has increasing functionality for making interactive plots."
- "The User Interface can be modified through the addition of widget."

---

## Overview

So far, we've used only Atlas as our training set. However, one can just as easily use other sets of ground truth data.

Topics:
* Converting vector datasets (`featureCollection`s) to images
* Sampling non-Atlas datasets
* Creating your own training sets

---
title: Improvements to float biogeochemical observations
description: Projects related to float observations and sensor accuracy/precision
---

Argo floats are autonomous profiling vehicles that adjust their buoyancy to profile once every ten days, spending the majority of their time at ~1000 m depth before diving to 2000 m, then rising to the ocean surface while measuring water and transmitting their data via satellite.  Biogeochemical sensors are being added to select Argo floats in ever increasing numbers.  

The addition of biogeochemical sensors to profiling floats has yielded annual cycles of observations in regions that previously were only measured sporadically. We use these measurements to understand net biological production, air-sea gas exchange, the relative roles of biology and physics in setting the large-scale cycles we observe, and much more.

Main takeaway: Newly available biogeochemical observations allow us to answer long-researched questions and ask new questions we never had the tools to consider.


## BGCArgo+: quality-controlled biogeochemical Argo dataset

The BGCArgo+ dataset is a quality-controlled compilation of biogeochemical Argo float data. The main access to this dataset is through the [BGCArgo+ website](https://www.bgc-argo-plus.info), where users can download and explore the data for research and analysis purposes.

<video src="/videos/bgc-float-deployment.mp4" autoplay muted loop playsinline style="width:100%; max-width:800px; border-radius:0.5rem; display:block; margin:1.5rem 0;"></video>

## Oxygen Sensor Calibration and Biases

Oxygen is a key ocean variable, but one that is surprisingly hard to measure accurately. I have developed in situ calibration approaches for oxygen optodes and am working to improve our understanding of how these techniques can be used on our growing array of robotic sensor platforms. The beauty of oxygen optodes is that they measure oxygen in both air and water. After demonstrating this in the lab we have used this technique in a mooring-based calibration system and on profiling Argo floats. Air calibration is now incorporated into most newly deployed biogeochemical floats and represents an important component of our ability to accurately measure the ocean.

While at the University of Washington, I developed a mooring based air-calibration system for oxygen optodes (Bushinsky and Emerson, 2013).  This system relied on pumping atmospheric air down to the sub-surface optode housing to calibrate the sensors once per day. 

We subsequently modified this technique and developed Special-Oxygen-Sensor Argo floats equipped with oxygen sensors on long stalks that allowed calibration against atmospheric oxygen after every profile. 

This not only provides high quality oxygen from Argo floats, fixing a major problem with sensor accuracy, but gave us the accuracy to discover and correct for an in-situ drift throughout a float’s 4-5 year deployment (Emerson and Bushinsky, 2014; Bushinsky et al., 2016).


# En-ROADS Climate Solutions Simulator: EXHAUSTIVE TECHNICAL DOCUMENTATION & REFERENCE

**Last Updated:** April 2026
**Official Source:** https://docs.climateinteractive.org/projects/en-roads/en/latest/
**Simulator:** https://en-roads.climateinteractive.org
**Authors:** Janet Chikofsky, Ellie Johnston, Andrew Jones, Yasmeen Zahar, Clara Iglesias, Chris Campbell, John Sterman, Lori Siegel, Cassandra Ceballos, Travis Franck, Florian Kapmeier, Stephanie McCauley, Rebecca Niles, Caroline Reed, Juliette Rooney-Varga, Elizabeth Sawin

---

## Chapter 1: Complete Documentation Index

The En-ROADS User Guide is organized into the following chapters:

### Core Foundation
1. **About En-ROADS** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/about.html
   - System-wide policy interaction model for global energy and climate challenges

2. **En-ROADS Tutorial** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/tutorial.html
   - Guided walkthrough of simulator features and basic usage

3. **En-ROADS Structure** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/structure.html
   - Four main GHG sources: Energy CO2, Land Use CO2, Carbon Dioxide Removal, Other Greenhouse Gases

4. **En-ROADS Baseline Scenario** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/baseline.html
   - Represents world state if societal/tech changes continue at current rate, without new policies

5. **Kaya Graphs** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/kaya.html
   - Decomposition of emissions into Population × GDP/capita × Energy/GDP × CO2/Energy

6. **En-ROADS Dynamics** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/background.html
   - System dynamics modeling approach, delay times, feedback loops, capital stock turnover

7. **Impacts of Climate Change** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/impacts.html
   - Temperature-damage function, economic impacts, crop yield impacts

### Energy Sector Sliders
8. **Coal** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/coal.html
   - Tax/subsidy on coal mining and combustion; most carbon-intensive fossil fuel

9. **Oil** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/oil.html
   - Tax/subsidy on drilling, refining, consuming; portable but hard to substitute

10. **Natural Gas** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/gas.html
    - Tax/subsidy on gas drilling/burning; lower emissions than coal but still fossil fuel

11. **Bioenergy** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/bioenergy.html
    - Biomass combustion for energy; can be carbon-neutral if sustainably produced

12. **Renewables** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/renewables.html
    - Wind, solar, geothermal, hydropower; low/no emissions but requires storage

13. **Nuclear** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/nuclear.html
    - Nuclear fission power; zero-carbon baseload electricity

14. **New Zero-Carbon** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/newtech.html
    - Emerging technologies beyond renewables and nuclear

### Policy & Carbon Management
15. **Carbon Pricing and Energy Standards** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/carbonprice.html
    - Global carbon price, Clean Electricity Standard, Emissions Performance Standard; affects all CO2 from energy

### Demand-Side Solutions
16. **Transport – Energy Efficiency** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/transport_ee.html
    - Vehicle efficiency improvements, modal shift to public transit

17. **Transport – Electrification** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/transport_elec.html
    - Shift to electric vehicles across cars, trucks, buses, aviation

18. **Buildings and Industry – Energy Efficiency** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/buildings_ee.html
    - HVAC efficiency, insulation, industrial process improvements

19. **Buildings and Industry – Electrification** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/buildings_elec.html
    - Heat pumps, electric furnaces, induction stoves, industrial electric heating

### Socioeconomic Drivers
20. **Population Growth** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/population.html
    - Global population trajectory; multiplied in Kaya Identity

21. **Economic Growth** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/econ_growth.html
    - GDP growth rate; affects consumption and energy demand

### Land Use & Agriculture
22. **Agricultural Emissions and Food Choices** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/ag_emissions.html
    - Methane from livestock, N2O from fertilizers; diet shifts

23. **Deforestation and Mature Forest Degradation** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/deforestation.html
    - Land use change emissions; forest preservation and reforestation

24. **Waste and Leakage** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/waste.html
    - Methane from waste decomposition and gas infrastructure leaks

### Carbon Removal
25. **Nature-Based Carbon Dioxide Removal** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/nature_based_removal.html
    - Reforestation, wetland restoration, soil carbon sequestration

26. **Technological Carbon Dioxide Removal** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/tech_removal.html
    - Direct Air Capture and Storage (DACCS), CCS, bioenergy with CCS

### Reference
27. **Glossary** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/glossary.html
28. **Model Version History** — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/changelog.html

---

## Chapter 2: ALL Charts/Graphs Catalog (40+ Output Visualizations)

En-ROADS exposes **over 100 output graphs** that update in real-time as sliders move. Below are the primary chart types organized by category:

### TEMPERATURE & CLIMATE OUTCOME CHARTS

**Chart 1: Global Temperature Change (primary headline metric)**
- **Y-axis label + units:** Temperature anomaly (°C) relative to 2005 baseline
- **X-axis:** Year, 2005–2100
- **What it shows:** Projected global mean temperature rise under current slider settings vs. baseline; shows 2°C, 1.5°C reference lines
- **Default in simulator?** YES (always visible, top-right)
- **Category:** Temperature
- **Color convention:** Blue = Baseline (no new action); Red or darker shade = Current Scenario

**Chart 2: Temperature Rise Sources / Attribution**
- **Y-axis label + units:** Contribution to temperature (°C)
- **X-axis:** Year, 2005–2100
- **What it shows:** Stacked breakdown by GHG source (Energy CO2, Land Use CO2, Other GHG, CO2 Removal)
- **Default in simulator?** YES
- **Category:** Temperature
- **Color convention:** Energy CO2 = dark brown; Land Use CO2 = green; Methane/N2O = orange; CO2 Removal = blue (negative)

**Chart 3: Cumulative CO2 Budget Tracking**
- **Y-axis label + units:** Gigatons CO2 (Gt CO2)
- **X-axis:** Year
- **What it shows:** Cumulative CO2 remaining in budget for 1.5°C, 2°C goals; depleting bar showing progress
- **Default in simulator?** Optional (Graphs > Climate)
- **Category:** Temperature
- **Color convention:** Red zone = overshoot; Green = within budget

### EMISSIONS CHARTS

**Chart 4: Global CO2 Emissions from Energy and Industry by Source**
- **Y-axis label + units:** Gigatons CO2 per year (Gt CO2/yr)
- **X-axis:** Year, 2005–2100
- **What it shows:** Stacked area chart showing coal, oil, gas, bioenergy contributions
- **Default in simulator?** YES
- **Category:** Emissions
- **Color convention:** Coal = dark gray/brown; Oil = red; Gas = dark blue; Bioenergy = pink; Renewables/Nuclear = light green/yellow

**Chart 5: Land Use CO2 Emissions**
- **Y-axis label + units:** Gt CO2/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Deforestation, forest degradation, reforestation impact
- **Default in simulator?** YES
- **Category:** Emissions
- **Color convention:** Positive (red) = net emissions; Negative (green) = CO2 removal via reforestation

**Chart 6: Methane Emissions**
- **Y-axis label + units:** Million metric tons CH4/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Methane from agriculture, gas leakage, waste
- **Default in simulator?** Related graph under carbon sector
- **Category:** Emissions
- **Color convention:** Light blue line for scenario vs. black baseline

**Chart 7: Non-CO2 Greenhouse Gas Emissions (N2O, F-gases)**
- **Y-axis label + units:** Gt CO2e/yr (CO2 equivalent)
- **X-axis:** Year, 2005–2100
- **What it shows:** Agricultural N2O, industrial F-gases from refrigeration
- **Default in simulator?** Optional
- **Category:** Emissions
- **Color convention:** Purple/orange shades

**Chart 8: CO2 Emissions by Sector (Energy, Agriculture, Land Use, Waste)**
- **Y-axis label + units:** Gt CO2/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Pie or stacked breakdown at a given year
- **Default in simulator?** Optional (Graphs > Emissions)
- **Category:** Emissions
- **Color convention:** Each sector = distinct color

### ENERGY CHARTS

**Chart 9: Global Sources of Primary Energy**
- **Y-axis label + units:** Exajoules (EJ) per year
- **X-axis:** Year, 2005–2100
- **What it shows:** Stacked area showing coal, oil, gas, bioenergy, nuclear, renewables mix
- **Default in simulator?** YES (middle panel, updates as sliders move)
- **Category:** Energy
- **Color convention:** Coal = dark gray; Oil = red; Gas = dark blue; Bioenergy = pink; Nuclear = yellow; Wind/Solar = light green

**Chart 10: % Electricity Consumption from Qualifying Sources**
- **Y-axis label + units:** Percentage (%)
- **X-axis:** Year, 2005–2100
- **What it shows:** Share of electricity from clean sources (renewables, nuclear, CCS) under Clean Electricity Standard
- **Default in simulator?** Optional (Carbon Price advanced settings)
- **Category:** Energy
- **Color convention:** Green = actual; gray = target line

**Chart 11: Existing Transport by Carrier / Technology**
- **Y-axis label + units:** Percent of vehicle fleet (%)
- **X-axis:** Year, 2005–2100
- **What it shows:** ICE cars → EV cars, combustion buses → electric buses, etc.
- **Default in simulator?** Optional (Transport slider graphs)
- **Category:** Energy
- **Color convention:** Each vehicle type = distinct color (red for ICE, blue for EV)

**Chart 12: Total Primary Energy Demand**
- **Y-axis label + units:** EJ/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Total energy (sum of all sources); shows impact of efficiency policies
- **Default in simulator?** Optional
- **Category:** Energy
- **Color convention:** Blue line = scenario vs. black = baseline

**Chart 13: Total Final Consumption of Energy Sources**
- **Y-axis label + units:** EJ/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Energy delivered to end-users after conversion losses
- **Default in simulator?** Optional
- **Category:** Energy
- **Color convention:** Blue = scenario, black = baseline

**Chart 14: Primary Energy Demand of Wind and Solar History (Model Comparison)**
- **Y-axis label + units:** EJ/yr
- **X-axis:** Year, 1990–2050+
- **What it shows:** Historical data + model projection; shows learning curves
- **Default in simulator?** Optional (Graphs > Model Comparison—Historical)
- **Category:** Energy
- **Color convention:** Purple dots = historical data; blue/black lines = model

**Chart 15: Marginal Cost of Electricity Production**
- **Y-axis label + units:** $/kWh (dollars per kilowatt-hour)
- **X-axis:** Year, 2005–2100
- **What it shows:** Cost trajectory for coal, gas, renewables, nuclear
- **Default in simulator?** Optional (Graphs > Financial)
- **Category:** Energy / Financial
- **Color convention:** Each fuel = distinct color

**Chart 16: Marginal Cost of Solar Electricity History**
- **Y-axis label + units:** $/kWh
- **X-axis:** Year, 1990–2100+
- **What it shows:** Historical 90% cost reduction per doubling (progress ratio); future projections
- **Default in simulator?** Optional
- **Category:** Energy / Financial
- **Color convention:** Purple dots = history; blue line = projection

**Chart 17: Coal Capacity Additions & Retirements**
- **Y-axis label + units:** GW (gigawatts)
- **X-axis:** Year, 2005–2100
- **What it shows:** New coal plants built vs. old plants retired; capital stock dynamics
- **Default in simulator?** Optional
- **Category:** Energy
- **Color convention:** Green = additions; red = retirements

### ECONOMIC / FINANCIAL CHARTS

**Chart 18: Average Price of Energy to Consumers**
- **Y-axis label + units:** $/GJ (dollars per gigajoule) or $/kWh
- **X-axis:** Year, 2005–2100
- **What it shows:** Impact of carbon price, fossil fuel taxes, renewable subsidies on energy costs
- **Default in simulator?** Optional (Graphs > Financial)
- **Category:** Financial
- **Color convention:** Blue = scenario, black = baseline

**Chart 19: Price of Coal**
- **Y-axis label + units:** $/ton
- **X-axis:** Year, 2005–2100
- **What it shows:** Mine-mouth coal price under different tax/subsidy levels
- **Default in simulator?** Related graph in Coal slider settings
- **Category:** Financial
- **Color convention:** Red line = scenario

**Chart 20: Price of Oil**
- **Y-axis label + units:** $/barrel
- **X-axis:** Year, 2005–2100
- **What it shows:** Wellhead oil price under different tax/subsidy levels
- **Default in simulator?** Related graph in Oil slider settings
- **Category:** Financial
- **Color convention:** Red line = scenario

**Chart 21: Price of Natural Gas**
- **Y-axis label + units:** $/MBtu (million BTU) or $/tonne CO2
- **X-axis:** Year, 2005–2100
- **What it shows:** Gas price under taxes/subsidies; comparison to coal, oil
- **Default in simulator?** Optional
- **Category:** Financial
- **Color convention:** Dark blue = scenario

**Chart 22: Economic Growth (GDP)**
- **Y-axis label + units:** Trillion $/yr (constant dollars)
- **X-axis:** Year, 2005–2100
- **What it shows:** Global GDP under baseline vs. climate-stressed scenario
- **Default in simulator?** Optional (Graphs > Socioeconomic)
- **Category:** Financial
- **Color convention:** Blue = with climate damage feedback; black = no damage

### LAND USE & AGRICULTURE CHARTS

**Chart 23: Land Use for Agriculture, Forest, & Other Uses**
- **Y-axis label + units:** Billion hectares or percentage (%)
- **X-axis:** Year, 2005–2100
- **What it shows:** Land conversion, deforestation vs. reforestation
- **Default in simulator?** Optional (Graphs > Land Use)
- **Category:** Land Use
- **Color convention:** Forest = green; agricultural = yellow/brown; urban = gray

**Chart 24: Crop Yield Growth Rate**
- **Y-axis label + units:** Percent change per year (%)
- **X-axis:** Year, 2005–2100
- **What it shows:** Impact of temperature increase on agricultural productivity
- **Default in simulator?** Optional
- **Category:** Land Use
- **Color convention:** Green = growth; red = decline

**Chart 25: Livestock Population & Food Demand**
- **Y-axis label + units:** Billion animals or Gigatons of food
- **X-axis:** Year, 2005–2100
- **What it shows:** Meat/dairy consumption impact on agricultural emissions
- **Default in simulator?** Optional
- **Category:** Land Use
- **Color convention:** Red = meat; blue = alternatives

### CARBON REMOVAL CHARTS

**Chart 26: Technological Carbon Dioxide Removal (DACCS)**
- **Y-axis label + units:** Gt CO2/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Direct air capture subsidy impact; ramp-up trajectory
- **Default in simulator?** Optional (Graphs > Carbon Removal)
- **Category:** Carbon Removal
- **Color convention:** Teal/cyan = DACCS; orange = point sources

**Chart 27: Nature-Based Carbon Dioxide Removal**
- **Y-axis label + units:** Gt CO2/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Reforestation, wetland restoration, soil carbon sequestration
- **Default in simulator?** Optional
- **Category:** Carbon Removal
- **Color convention:** Dark green = reforestation; light green = other nature-based

**Chart 28: Total CO2 Removed (All Methods)**
- **Y-axis label + units:** Gt CO2/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Cumulative impact of all CDR strategies
- **Default in simulator?** Optional
- **Category:** Carbon Removal
- **Color convention:** Stacked: blue (DACCS) + green (natural)

### AIR QUALITY & HEALTH CHARTS

**Chart 29: Air Pollution from Energy**
- **Y-axis label + units:** Million premature deaths per year or µg/m³ PM2.5
- **X-axis:** Year, 2005–2100
- **What it shows:** Impact of coal, oil combustion on air quality; coal phase-out benefit
- **Default in simulator?** Optional (Graphs > Social Impact)
- **Category:** Health
- **Color convention:** Red = high pollution (coal-heavy); green = low pollution

### SOCIOECONOMIC DRIVERS

**Chart 30: Global Population**
- **Y-axis label + units:** Billion people
- **X-axis:** Year, 2005–2100
- **What it shows:** UN population projections; multiplier in Kaya Identity
- **Default in simulator?** Optional (Graphs > Socioeconomic)
- **Category:** Socioeconomic
- **Color convention:** Blue line

**Chart 31: GDP Per Capita (Consumption)**
- **Y-axis label + units:** $/person/year (constant $) or $/capita
- **X-axis:** Year, 2005–2100
- **What it shows:** Economic affluence; second term of Kaya Identity
- **Default in simulator?** Optional
- **Category:** Socioeconomic
- **Color convention:** Blue = scenario with climate damage; black = baseline

**Chart 32: Energy Intensity (Energy per GDP)**
- **Y-axis label + units:** MJ/$ or kWh/GDP
- **X-axis:** Year, 2005–2100
- **What it shows:** Third term of Kaya; efficiency improvements reduce this
- **Default in simulator?** Optional (Graphs > Energy Intensity)
- **Category:** Socioeconomic
- **Color convention:** Downward slope = success; flat/upward = failure

**Chart 33: Carbon Intensity (CO2 per Energy)**
- **Y-axis label + units:** kg CO2/MJ or t CO2/GJ
- **X-axis:** Year, 2005–2100
- **What it shows:** Fuel mix decarbonization; fourth term of Kaya
- **Default in simulator?** Optional
- **Category:** Socioeconomic
- **Color convention:** Rapid drop = coal → renewables shift

### DETAILED ENERGY MIX BREAKDOWNS

**Chart 34: Electricity Generation Mix (Pie or Stacked)**
- **Y-axis label + units:** EJ/yr or % share
- **X-axis:** Year, single snapshot or time series
- **What it shows:** Coal, gas, nuclear, wind, solar %, hydro % at given year
- **Default in simulator?** Optional (snapshot view at year slider)
- **Category:** Energy
- **Color convention:** Matches primary energy chart palette

**Chart 35: Transport Energy by Fuel Type**
- **Y-axis label + units:** EJ/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Oil → electricity shift in cars, buses, trucks, aviation
- **Default in simulator?** Optional (Transport sector graphs)
- **Category:** Energy
- **Color convention:** Red = oil/combustion; blue = electricity

**Chart 36: Buildings & Industry Energy by Fuel**
- **Y-axis label + units:** EJ/yr
- **X-axis:** Year, 2005–2100
- **What it shows:** Heating fuel mix: natural gas → electricity, biomass, solar thermal
- **Default in simulator?** Optional
- **Category:** Energy
- **Color convention:** Dark blue = gas; yellow = electric heat; orange = biomass

### ADVANCED SYSTEM DYNAMICS CHARTS

**Chart 37: Capital Stock Turnover (Illustrative)**
- **Y-axis label + units:** Years
- **X-axis:** Technology
- **What it shows:** Average lifetimes: coal plants ~30yr, gas ~30yr, vehicles ~15yr, buildings ~50yr
- **Default in simulator?** Not directly shown; described in Model Structure pages
- **Category:** System Dynamics
- **Color convention:** Gray bars

**Chart 38: Delay in Policy Effectiveness**
- **Y-axis label + units:** Years
- **X-axis:** Policy type (coal tax, renewable subsidy, etc.)
- **What it shows:** Lag before slider change is fully reflected; typically 10–30 years
- **Default in simulator?** Not visualized; explained in documentation
- **Category:** System Dynamics
- **Color convention:** N/A

**Chart 39: Feedback Loop Strength (Illustrative)**
- **Y-axis label + units:** Qualitative (strong, moderate, weak)
- **X-axis:** Loop name (coal phase-out → gas demand, efficiency → rebound effect, etc.)
- **What it shows:** Which feedback loops dominate model behavior
- **Default in simulator?** Shown in system dynamics training videos
- **Category:** System Dynamics
- **Color convention:** Red = reinforcing (amplifies change); blue = balancing (resists change)

**Chart 40: Scenario Comparison Overlay**
- **Y-axis label + units:** Same as underlying chart (°C, Gt CO2, EJ, etc.)
- **X-axis:** Year, 2005–2100
- **What it shows:** Multiple named scenarios (Baseline, Paris Agreement, Net Zero) plotted together
- **Default in simulator?** YES (via "Scenarios" panel)
- **Category:** Comparison / Meta
- **Color convention:** Each scenario = distinct color (e.g., black baseline, blue user scenario, green "Plausible Pledges")

---

## Chapter 3: ALL Sliders / Levers (19 Main + 50+ Advanced Settings)

En-ROADS features **19 primary sliders** that represent major climate policy levers, plus extensive advanced settings for granular control. Each slider combines multiple real-world policy instruments.

### FOSSIL FUEL SLIDERS (4)

#### **Slider 1: COAL**
- **Official name:** Coal
- **Icon:** Factory with smokestacks (🏭)
- **Range:** -50% to +200% of price at source
- **Status quo (default) value:** -30% (net 30% subsidy, reflecting global coal subsidies)
- **What policy it represents:** Taxes on coal mining & combustion + removal/expansion of subsidies; also controls coal plant phase-out rates
- **Graphs primarily affected:** 
  - Global Sources of Primary Energy (brown coal area shrinks)
  - CO2 Emissions from Energy (brown coal contribution drops)
  - Air Pollution from Energy (PM2.5 from coal combustion)
- **Real-world example:** EU coal phase-out (Germany by 2030, UK by 2024); China's coal production reduction targets
- **Slider Settings Breakdown:**
  | Level | Range | Interpretation |
  |-------|-------|-----------------|
  | Highly Discouraged | +100% to +200% | Heavy tax on coal; strong phase-out incentive |
  | Discouraged | 0% to +100% | Net tax on coal (~$20–$200/ton) |
  | Status Quo | -35% to -25% | Global avg: ~30% net subsidy |
  | Encouraged | -25% to 0% | Weak subsidy or no action |
  | More Encouraged | 0% to -50% | Active subsidy expansion |

**Advanced settings unlocked:**
  - "Reduce new coal infrastructure" slider (0–100%)
  - "% Reduction in coal utilization" slider (force retirement of existing plants)
  - "Coal plant accelerated retirement" slider
  - "Coal CCS subsidy" slider
  - "Coal subsidy" and "Coal tax" sliders (separate fine-grained control)

---

#### **Slider 2: OIL**
- **Official name:** Oil
- **Icon:** Oil derrick (🛢️)
- **Range:** -50% to +200% of price at wellhead
- **Status quo (default) value:** +5% (net slight tax globally, varying by region)
- **What policy it represents:** Oil drilling/refining taxes and subsidy removal; net effect on retail fuel prices; transport electrification incentive (oil price↑ → EV cheaper by comparison)
- **Graphs primarily affected:**
  - Global Sources of Primary Energy (red oil area)
  - % Existing Transport by Carrier (ICE → EV shift)
  - CO2 Emissions by Source
- **Real-world example:** Norway carbon tax on oil (€80/tonne CO2); Saudi subsidy expansion; US states' EV incentives (implicit oil tax equivalent)
- **Key Dynamic - "Squeezing the Balloon":** Taxing oil alone causes coal & gas demand to increase; carbon price needed for comprehensive approach
- **Slider ranges:** Identical structure to Coal (Highly Discouraged to More Encouraged)

---

#### **Slider 3: NATURAL GAS**
- **Official name:** Natural Gas
- **Icon:** Factory with pipe (🏭)
- **Range:** -50% to +200% of price at production wellhead
- **Status quo (default) value:** ±0% (net near-zero globally; highly regional variation)
- **What policy it represents:** Gas drilling taxes, fracking restrictions, methane leak reduction incentives, subsidy removal
- **Graphs primarily affected:**
  - Global Sources of Primary Energy (dark blue gas area)
  - Methane Emissions (leakage from gas infrastructure)
  - CO2 Emissions from Energy
- **Real-world example:** EU ban on new gas hookups; US methane emissions regulation; Australia's gas restrictions
- **Big Message:** "More natural gas is not an effective long-term strategy for the climate—it is less carbon intensive than coal, but it still emits carbon dioxide."
- **Key Dynamic - Methane Leakage:** Discouraging gas incentivizes leak detection and repair; encourages transitioning to renewables or nuclear

---

#### **Slider 4: BIOENERGY**
- **Official name:** Bioenergy
- **Icon:** Wheat/corn stalk (🌾)
- **Range:** -50% to +200% of levelized cost
- **Status quo (default) value:** -20% (modest subsidy in some regions; production varies)
- **What policy it represents:** Subsidies for biomass combustion for heat/electricity; also affects bioenergy with CCS (BECCS)
- **Graphs primarily affected:**
  - Global Sources of Primary Energy (pink bioenergy area)
  - Land Use CO2 Emissions (if bioenergy drives deforestation vs. waste biomass)
  - Carbon Removal (if paired with CCS)
- **Real-world example:** EU Renewable Energy Directive subsidizing pellets; Brazil's ethanol subsidies; US biomass co-firing incentives
- **Advanced settings:**
  - "Carbon price applies to bioenergy emissions" toggle (default: OFF, treating as carbon-neutral even if not truly net-zero)
  - "Bioenergy CCS subsidy" slider
  - "Reduce unsustainable bioenergy" slider (force shift to waste-only biomass)

---

### CLEAN ENERGY SLIDERS (3)

#### **Slider 5: RENEWABLES**
- **Official name:** Renewables
- **Icon:** Wind turbine + solar panel (⚡☀️)
- **Range:** -100% to +50% of levelized cost
- **Status quo (default) value:** -25% (net 25% subsidy in many regions)
- **What policy it represents:** Tax incentives, production tax credits, investment subsidies for wind, solar, geothermal, hydropower; also implicit subsidy for energy storage (batteries, hydrogen)
- **Graphs primarily affected:**
  - Global Sources of Primary Energy (light green renewables area grows; coal/gas shrink)
  - Marginal Cost of Solar Electricity History (shows learning curve cost reduction)
  - % Electricity Consumption from Qualifying Sources
- **Real-world example:** German Renewable Energy Act (feed-in tariffs); US Investment Tax Credit (30%); UK Contracts for Difference auctions
- **Key Dynamic - Price-Demand Feedback:** Lower renewable cost → cheaper electricity → higher energy demand → some offset to GHG reduction benefit
- **Key Dynamic - Capital Stock Turnover Delays:** Takes 10–30 years for subsidies to translate to installed capacity (new plants built as old retire)
- **Advanced settings:**
  - "Renewables breakthrough cost reduction" slider (simulates 30% sudden cost drop)
  - "Green hydrogen production subsidy" slider
  - "Other storage breakthrough cost reduction" slider
  - Separate sub-sliders for solar vs. wind encouragement

---

#### **Slider 6: NUCLEAR**
- **Official name:** Nuclear
- **Icon:** Atom (⚛️)
- **Range:** -100% to +100% of construction cost
- **Status quo (default) value:** ±0% (varies; some countries subsidize, others tax or phase out)
- **What policy it represents:** Reactor construction subsidies, waste-handling support, decommissioning funds; or taxes/restrictions if discouraged
- **Graphs primarily affected:**
  - Global Sources of Primary Energy (yellow nuclear area)
  - Electricity Generation Mix
- **Real-world example:** France (massive subsidies, 70% nuclear); UK Hinkley Point C (£46B subsidy); Germany Energiewende (phase-out by 2023, extended to 2024)
- **Big Message:** Zero-carbon baseload power; **not modeled as a complete substitute for renewables**—intended as complementary (24/7 baseload + variable renewables)
- **Advanced settings:**
  - "Reduce new nuclear capacity" slider (force slower deployment)
  - "Nuclear cost reduction" slider (breakthrough learning curve)

---

#### **Slider 7: NEW ZERO-CARBON TECHNOLOGIES**
- **Official name:** New Zero-Carbon (sometimes "Clean Tech" or "Advanced Tech")
- **Icon:** Lightbulb or gear (💡⚙️)
- **Range:** -100% to +100% of cost
- **Status quo (default) value:** ±0%
- **What policy it represents:** Future technologies not yet modeled separately (e.g., next-gen fusion, advanced geothermal, advanced nuclear, green ammonia synthesis)
- **Graphs primarily affected:**
  - Global Sources of Primary Energy (very small initial contribution; grows as cost drops)
- **Real-world example:** Helion fusion tax credits; Commonwealth Fusion Systems; geothermal-enhanced reservoirs
- **Advanced settings:** Often minimal; treated as residual "other" category

---

### CARBON PRICING & STANDARDS SLIDER (1 complex slider)

#### **Slider 8: CARBON PRICING AND ENERGY STANDARDS**
- **Official name:** Carbon Pricing and Energy Standards
- **Icon:** Dollar sign + Euro sign ($€)
- **Range:** $0–$250/tonne CO2 (logarithmic scale)
- **Status quo (default) value:** $5/tonne (reflects that ~15% of global emissions are under some carbon price)
- **What policy it represents:** 
  - Global average carbon tax ($/tonne CO2 emitted)
  - OR cap-and-trade system (ETS price equivalent)
  - Affects **all** CO2 from energy & industry (unlike fuel-specific sliders)
- **Graphs primarily affected:**
  - Global Temperature Change (headline metric most sensitive to this slider)
  - Global Sources of Primary Energy (all fuels respond simultaneously)
  - CO2 Emissions from Energy (steep drop with high carbon price)
  - Average Price of Energy to Consumers
- **Real-world examples:**
  - EU ETS: €80/tonne CO2 (as of 2024)
  - Carbon Tax (Canada): CAD $170/tonne (2024), rising to CAD $340 by 2030
  - Nordic countries: €100–150/tonne CO2
  - New Zealand: ~NZD $55–75/tonne

**Slider Settings Breakdown (Carbon Price Levels):**
| Level | Range | Interpretation |
|-------|-------|-----------------|
| Status Quo | $0–$5 | Minimal global carbon price |
| Low | $5–$20 | Nascent carbon pricing ~10 regions |
| Medium | $20–$60 | Growing coverage; covers ~30% of emitters |
| High | $60–$100 | Global near-universal coverage |
| Very High | $100–$250 | Full global carbon price; aggressive climate action |

**Big Messages (from docs):**
- "Pricing carbon is a high leverage strategy, as it both reduces the carbon intensity of the energy supply and reduces the overall energy demand."
- Coal most sensitive (brown shrinks fastest); Oil least sensitive (portability makes substitution difficult)

**Advanced Settings - Carbon Price:**
1. **"Carbon price applies to bioenergy emissions"** toggle
   - Default: OFF (treats bioenergy as net-zero carbon)
   - ON: Applies carbon price to net emissions even from "carbon-neutral" biomass
   
2. **"Carbon price encourages carbon capture and storage (CCS)"** toggle
   - Default: ON (high carbon price makes CCS economically viable)
   - OFF: CCS only grows if explicitly subsidized
   
3. **"Carbon price encourages direct air carbon capture and storage (DACCS)"** toggle
   - Default: ON (high carbon price funds DACCS)
   - OFF: DACCS only grows via dedicated subsidy

4. **"Use clean electricity standard"** toggle (alternative to carbon price)
   - Sets target % of electricity from "clean" sources (user selects which sources count)
   - Slider: "Target % electricity from qualifying sources" (0–100%)
   - Checkbox list: Coal+CCS, Gas+CCS, Nuclear, Renewables, Bioenergy+CCS (user picks which are "clean")
   - Creates implicit subsidy to selected sources, penalty to excluded sources

5. **"Emissions performance standard"** slider
   - Sets max CO2 intensity for electric generators (t CO2/TJ)
   - Default ranges: Coal ~90 t CO2/TJ (penalized) → Gas ~51 t CO2/TJ (discouraged) → Renewables ~0 (allowed)
   - Disincentivizes high-carbon plants; encourages clean generation

---

### DEMAND-SIDE / EFFICIENCY SLIDERS (4)

#### **Slider 9: TRANSPORT – ENERGY EFFICIENCY**
- **Official name:** Transport – Energy Efficiency
- **Icon:** Car with gear (🚗⚙️)
- **Range:** 0–100% improvement in fuel economy (per mile)
- **Status quo (default) value:** 30% assumed improvement by 2050 (CAFE standards, EU CO2 standards already built in)
- **What policy it represents:** 
  - Fuel economy standards (CAFE in US, EU CO2 standards)
  - Aerodynamics, lightweight materials R&D
  - Mode shift incentives (transit subsidies)
  - Vehicle ridesharing infrastructure
- **Graphs primarily affected:**
  - Total Final Consumption of Energy Sources (total transport energy shrinks)
  - Transport Energy by Fuel Type (oil demand reduction, but note: applies to ICE vehicles' efficiency, not electrification)
- **Real-world example:** 
  - EU target: 100 g CO2/km by 2025 (~2.2 L/100km equivalent)
  - US CAFE: 50+ mpg by 2026 target
  - China: ~130 g CO2/km target
- **Key Dynamic:** Rebound Effect - cheaper-to-drive vehicles encourage more driving, offsetting some benefit
- **Advanced settings:**
  - "Advanced driving techniques adoption" slider (driver training, eco-driving)

---

#### **Slider 10: TRANSPORT – ELECTRIFICATION**
- **Official name:** Transport – Electrification
- **Icon:** Electric car (🔌🚗)
- **Range:** 0–100% of transport fleet electrified
- **Status quo (default) value:** 25% by 2050 (reflects current EV growth trends, some policy targets)
- **What policy it represents:**
  - EV purchase subsidies / rebates
  - EV tax incentives
  - Restrictions on ICE sales (e.g., EU ban by 2035)
  - Charging infrastructure investment
  - Low/zero-emission vehicle mandates
- **Graphs primarily affected:**
  - % Existing Transport by Carrier (ICE→EV shift, dramatic color change)
  - Transport Energy by Fuel Type (oil → electricity)
  - Electricity demand and generation (renewables/nuclear used for transport)
  - CO2 Emissions from Energy (oil area shrinks)
- **Real-world example:**
  - Norway: 80% new EV sales (2023+)
  - EU: 100% zero-emission new cars by 2035
  - California: 100% ZEV sales by 2035
  - China: NEV targets (60% by 2035)
- **Key Dynamic - Electricity Grid Integration:** Transport electrification only reduces emissions if electricity is clean; drives demand for renewable+storage capacity
- **Advanced settings:**
  - "EV battery cost reduction" slider
  - "EV charging infrastructure deployment rate" slider
  - "Aviation electrification rate" slider (separate from cars/buses)

---

#### **Slider 11: BUILDINGS AND INDUSTRY – ENERGY EFFICIENCY**
- **Official name:** Buildings and Industry – Energy Efficiency
- **Icon:** Building with gear (🏢⚙️)
- **Range:** 0–100% improvement in thermal efficiency
- **Status quo (default) value:** 30% assumed improvement by 2050 (EU Building Directive, building codes already assumed)
- **What policy it represents:**
  - Building insulation standards
  - HVAC efficiency requirements
  - Industrial process improvements (cement, steel, chemicals)
  - Smart controls, demand response
  - District heating efficiency
- **Graphs primarily affected:**
  - Total Final Consumption of Energy Sources (buildings/industry energy shrinks)
  - Energy Intensity (overall efficiency metric improves)
- **Real-world example:**
  - EU Building Renovation Wave: 50% deep renovations by 2050
  - US Inflation Reduction Act building electrification rebates
  - China building energy codes / passive house standards
- **Key Dynamic - Capital Stock Turnover:** Buildings last 50+ years; slow turnover means efficiency gains take decades to scale
- **Advanced settings:**
  - "District heating expansion" slider (shift to centralized heating)
  - "Industrial heat electrification" slider

---

#### **Slider 12: BUILDINGS AND INDUSTRY – ELECTRIFICATION**
- **Official name:** Buildings and Industry – Electrification
- **Icon:** Lightning bolt (⚡)
- **Range:** 0–100% of heating/process heat from electricity (heat pumps, induction, etc.)
- **Status quo (default) value:** 20% by 2050 (some heat pump growth already in baseline)
- **What policy it represents:**
  - Heat pump installation subsidies
  - Restrictions on new gas boilers (e.g., UK ban by 2035, EU by 2025)
  - Induction stove incentives
  - Industrial electric furnace R&D
  - Natural gas utility restrictions
- **Graphs primarily affected:**
  - Global Sources of Primary Energy (natural gas area shrinks, electricity↑)
  - Buildings & Industry Energy by Fuel (gas → electric heat)
  - Electricity demand (↑ from electrification, more renewable capacity needed)
  - Natural Gas emissions (drop as gas heating eliminated)
- **Real-world example:**
  - Denmark: heat pump mandate in all new buildings
  - France: ban on gas boiler installations in 2022
  - Germany: 80% heating from renewables by 2050
  - California: all-electric building code
- **Advanced settings:**
  - "Heat pump cost reduction" slider
  - "Industrial heat recovery & waste heat reuse" slider

---

### SOCIOECONOMIC & LAND USE SLIDERS (4)

#### **Slider 13: POPULATION GROWTH**
- **Official name:** Population Growth
- **Icon:** People (👥)
- **Range:** Typically fixed UN trajectories; no slider in main interface; optional in advanced settings
- **Status quo (default) value:** UN Medium Scenario (~9.7 billion by 2050, peak ~10.2B around 2080)
- **What it represents:** First term of Kaya Identity; demographics affect total energy demand and agricultural emissions
- **Graphs primarily affected:**
  - Global Temperature (higher pop → more emissions)
  - Economic Growth (if per-capita GDP fixed, higher pop = higher total GDP)
  - Agricultural Emissions (more people = more food demand)
- **Real-world context:** Population growth slowing globally; UN Low variant (8.8B by 2050) vs. High variant (10.2B by 2050)
- **Advanced settings (if enabled):**
  - Switch between UN scenarios (Low, Medium, High fertility variants)

---

#### **Slider 14: ECONOMIC GROWTH (GDP Per Capita)**
- **Official name:** Economic Growth
- **Icon:** Money bags or graph (💰📈)
- **Range:** Typically 1–4% annual real GDP per capita growth rate
- **Status quo (default) value:** ~2% global average (varies by region; poor countries ~4–5%, rich countries ~1.5%)
- **What policy it represents:** 
  - Development pathway (poor countries grow faster)
  - Consumption growth in wealthy countries
  - Second term of Kaya Identity
- **Graphs primarily affected:**
  - Global Temperature (richer = more energy demand, unless offset by efficiency)
  - Energy Demand (positive correlation)
  - Economic Growth chart (GDP growth rate directly set)
- **Real-world example:**
  - OECD average: 1.5–2% real growth
  - Developing Asia: 3–5%
  - Sub-Saharan Africa: 3–4%
- **Advanced settings:**
  - "Decoupling scenario" toggle: whether growth decouples from energy demand (energy efficiency can override pop×GDP effect)

---

#### **Slider 15: AGRICULTURAL EMISSIONS AND FOOD CHOICES**
- **Official name:** Agricultural Emissions and Food Choices
- **Icon:** Cow or wheat (🐄 🌾)
- **Range:** 0–100% reduction in agricultural emissions per unit food
- **Status quo (default) value:** 0% (baseline assumes no dietary shift, methane reduction)
- **What policy it represents:**
  - Diet shift (meat → plant-based, especially in rich countries)
  - Livestock methane reduction (selective breeding, feed additives, anaerobic digesters)
  - Fertilizer management (reduce N2O emissions)
  - Crop yield improvements (more food per hectare)
- **Graphs primarily affected:**
  - Methane Emissions (livestock methane drops)
  - Land Use CO2 Emissions (agricultural emissions category)
  - Cumulative GHG Emissions
- **Real-world example:**
  - Flexitarian diets (reduce meat 25–50%): ~10% GHG reduction
  - Methane digesters on farms: 5–10% livestock methane reduction
  - Precision agriculture (variable-rate N fertilizer): 10–20% N2O reduction
- **Advanced settings:**
  - "Meat consumption reduction rate" slider (0–75% reduction by 2100)
  - "Livestock methane reduction rate" slider
  - "Fertilizer N2O reduction rate" slider
  - "Crop yield improvement rate" slider (technological boost)

---

### LAND USE SLIDERS (2)

#### **Slider 16: DEFORESTATION AND MATURE FOREST DEGRADATION**
- **Official name:** Deforestation and Mature Forest Degradation
- **Icon:** Tree (🌲)
- **Range:** 0–100% reduction in deforestation rate
- **Status quo (default) value:** 0% (baseline assumes ~5 Mha/yr net forest loss continues)
- **What policy it represents:**
  - Protected areas expansion
  - Indigenous land rights enforcement
  - Reforestation / afforestation programs
  - Sustainable forest management
  - Agricultural land use intensification (reduce need for expansion)
- **Graphs primarily affected:**
  - Land Use CO2 Emissions (deforestation = source; reforestation = sink)
  - Global Temperature (major lever for near-term emissions reduction)
  - Land Use for Agriculture/Forest categories
- **Real-world example:**
  - Brazilian Amazon: 60% reduction in deforestation (2004–2012); now rising again
  - Indonesia forest loss: ~0.5 Mha/yr (declining from peak)
  - UN-REDD+ program targets: zero net deforestation by 2030
- **Big Message:** Stopping deforestation is one of the highest leverage, lowest-cost climate actions
- **Advanced settings:**
  - "Reduce forest degradation" slider (selective logging, logging road impact reduction)
  - "Reforestation rate" slider (active tree planting vs. passive restoration)
  - "Agroforestry expansion" slider

---

#### **Slider 17: WASTE AND LEAKAGE**
- **Official name:** Waste and Leakage
- **Icon:** Trash can (🗑️)
- **Range:** 0–100% reduction in methane from waste, gas infrastructure
- **Status quo (default) value:** 0% (baseline assumes some landfill gas capture, but continued leakage)
- **What policy it represents:**
  - Landfill gas capture and combustion/use
  - Wastewater treatment methane reduction
  - Gas pipeline leak detection & repair
  - Coal mine methane capture
  - Waste reduction / circular economy
- **Graphs primarily affected:**
  - Methane Emissions (often 10–15% of total without action)
  - Cumulative CO2e emissions
- **Real-world example:**
  - US methane regulations: 65% reduction in oil & gas methane by 2030
  - EU Methane Strategy: 45% reduction by 2030
  - Landfill gas projects: capture 50–75% in developed countries
  - Coal mine methane: capture ~20 Mtonnes CO2e/yr globally
- **Advanced settings:**
  - "Coal mine methane capture" slider
  - "Oil & gas methane leak rate" slider
  - "Landfill gas capture & use" slider
  - "Wastewater methane reduction" slider

---

### CARBON REMOVAL SLIDERS (2)

#### **Slider 18: NATURE-BASED CARBON DIOXIDE REMOVAL**
- **Official name:** Nature-Based Carbon Dioxide Removal
- **Icon:** Tree + green (🌲💚)
- **Range:** 0–100% deployment potential (Gt CO2/yr scale-up)
- **Status quo (default) value:** 0% (no additional nature-based CDR)
- **What policy it represents:**
  - Reforestation (separate from deforestation slider; this is active afforestation)
  - Wetland restoration
  - Soil carbon sequestration (no-till agriculture, biochar)
  - Peatland restoration
  - Kelp farming / blue carbon
- **Graphs primarily affected:**
  - Land Use CO2 Emissions (negative = CO2 removal)
  - Global Temperature (net emissions reduction)
  - Nature-Based CDR chart (Gt CO2/yr removed)
- **Real-world example:**
  - Global reforestation potential: ~0.5 Gt CO2/yr by 2100
  - Soil carbon potential: ~0.4 Gt CO2/yr
  - Wetland restoration: ~50 Mt CO2/yr currently
  - Natural climate solutions (Hawken 2019): ~11 Gt CO2/yr total potential
- **Key Dynamic:** Nature-based CDR can rebound (forests can burn, release CO2); requires ongoing management
- **Advanced settings:**
  - "Reforestation rate" slider (ha/yr planted)
  - "Soil carbon sequestration rate" slider
  - "Wetland restoration rate" slider
  - "Peatland restoration rate" slider

---

#### **Slider 19: TECHNOLOGICAL CARBON DIOXIDE REMOVAL (DACCS, CCS)**
- **Official name:** Technological Carbon Dioxide Removal
- **Icon:** Filter / capture (🔧⚙️)
- **Range:** 0–100% subsidy reduction in cost (dramatic breakthrough potential)
- **Status quo (default) value:** 0% (baseline assumes DACCS stays expensive ~$250–600/tonne CO2)
- **What policy it represents:**
  - Direct Air Capture and Storage (DACCS) subsidies
  - Point-source CCS (from power plants, cement, steel plants)
  - Bioenergy with CCS (BECCS)
  - Geological storage deployment
  - R&D for cost reduction (current: $250/tonne → goal: <$100/tonne)
- **Graphs primarily affected:**
  - Global Temperature (net emissions reduction via removal)
  - CO2 Removed (technological chart shows Gt CO2/yr removed)
  - Cumulative CO2 (shows impact of removal toward net-zero)
- **Real-world example:**
  - Climeworks (Switzerland): ~$600–1000/tonne CO2 (2024), targeting $200 by 2030
  - Carbon Engineering (Canada): ~$250/tonne (modeled)
  - CarbonCure (point-source): concrete uses captured CO2
  - Current deployment: ~1 Mt CO2 captured/yr globally (2024)
  - IEA pathway: 800 Mt CO2/yr removal by 2050 needed for 1.5°C
- **Advanced settings:**
  - "Direct Air Capture subsidy" slider (separate DACCS control)
  - "Point-source CCS subsidy" slider (power plants, industrial)
  - "Bioenergy + CCS subsidy" slider (BECCS)
  - "CCS storage capacity breakthrough" toggle (can geological storage scale to needed levels?)
  - "DACCS cost reduction breakthrough" slider (50% sudden cost drop)
  - "CO2 utilization rate" slider (captured CO2 used for products vs. stored)

---

## Chapter 4: System Dynamics Methodology & Deep Detail

### THE KAYA IDENTITY: Core Framework

En-ROADS uses the **Kaya Identity** as its fundamental organizing principle. This multiplicative decomposition breaks global energy CO2 emissions into four modifiable terms:

**F = P × (G/P) × (E/G) × (C/E)**

Where:
- **F** = Total energy CO2 emissions (Gt CO2/yr)
- **P** = Global population (billions)
- **G/P** = GDP per capita ($/person/yr; consumption/affluence)
- **E/G** = Energy intensity (MJ of energy per $ of GDP; efficiency)
- **C/E** = Carbon intensity (kg CO2 per MJ of energy; fuel mix decarbonization)

**En-ROADS interpretation:** Reducing F requires action on all four levers:
1. Population growth (slow, difficult; not primary policy lever in En-ROADS)
2. GDP per capita (development fairness; En-ROADS models feedback between climate damage & GDP)
3. Energy efficiency (buildings, transport, industry)
4. Fuel mix decarbonization (coal→renewables, electrification)

**Non-CO2 GHG sources are modeled separately:**
- Land Use CO2 (deforestation, reforestation)
- Methane (livestock, waste, gas leakage)
- N2O (fertilizer use)
- F-gases (refrigeration, HVAC)

---

### THE 18 SUB-MODELS (Primary System Dynamics Modules)

En-ROADS is composed of ~18–20 interconnected sub-models, each representing a sector or cross-cutting system:

1. **Energy Supply Sub-Model** (~6 fuel types modeled)
   - Coal capacity, utilization, retirement (endogenous cost-driven investment dynamics)
   - Oil supply & demand
   - Natural gas supply & demand
   - Bioenergy supply
   - Nuclear capacity
   - Renewables (wind + solar bundled; hydro treated as mature)
   - Technology learning curves: solar cost declines at 20% per doubling of capacity (progress ratio)
   - Capital stock turnover: avg plant lifetimes coal/gas ~30yr, nuclear ~40yr, renewables ~25yr

2. **Electricity Sub-Model**
   - Dispatch logic: merit order (cheapest first) with some grid stability constraints
   - Demand-supply matching with energy storage implicit in cost
   - Clean Electricity Standard implementation
   - Emissions Performance Standard enforcement
   - Electricity price determination (cost-based with markup)

3. **Transport Energy Sub-Model**
   - Fleet composition: ~15-20 year average vehicle lifetime
   - ICE vehicle efficiency improvements (fuel economy standards)
   - EV adoption (cost-driven; battery cost decline feedback loop)
   - Electrification of buses, trucks, aviation (separate pathways)
   - Rebound effect: cheaper transport → more miles driven

4. **Buildings Energy Sub-Model**
   - Space heating (fossil fuels vs. heat pumps vs. solar thermal)
   - Hot water, cooking, lighting, appliances
   - Building stock turnover (~50 year average lifetime)
   - Retrofitting existing buildings (slow adoption; cost-dependent)
   - Efficiency standards effect on new construction

5. **Industrial Energy Sub-Model**
   - Steel (10% of global CO2; electric arc vs. blast furnace)
   - Cement (5% of global CO2; clinker-heavy; limited low-carbon options)
   - Chemicals, refining, mining (lumped together)
   - High-temperature heat (hard to decarbonize below 500°C)
   - Industrial CCS opportunity

6. **Agriculture & Land Use Sub-Model**
   - Livestock population (endogenous to food demand & prices)
   - Crop yield growth (autonomous + climate damage feedback)
   - Fertilizer use & N2O emissions
   - Methane from enteric fermentation (ruminants)
   - Dietary choices (meat vs. plant-based) policy lever
   - Land use intensity (extensification vs. intensification)

7. **Forestry & Deforestation Sub-Model**
   - Deforestation rate (current: ~5 Mha/yr; policy adjustable)
   - Forest degradation vs. clear-cutting
   - Reforestation / afforestation (limited by land availability)
   - Forest carbon stock dynamics (CO2 sequestration rate)
   - Carbon payback period for reforestation (50–100 years typical)
   - Logging intensity & timber yield

8. **Waste & Methane Sub-Model**
   - Landfill methane generation (CH4 produced per tonne waste)
   - Landfill gas capture rate (0–75% range depending on policy/technology)
   - Wastewater methane (smaller source)
   - Coal mine methane (separate; ~30 Mtonnes CO2e/yr global)
   - Gas infrastructure leakage (0.5–3% of production depending on infrastructure quality)

9. **Technological CDR Sub-Model**
   - Direct Air Capture (DACCS) deployment
   - Point-source CCS (power plants, cement, steel, refineries, chemicals)
   - Bioenergy + CCS (BECCS) interaction with energy supply
   - Geological storage capacity (implicitly unlimited in current model; advanced settings can constrain)
   - Cost reduction through deployment scale (50% cost reduction per 10× deployment growth)

10. **Natural Carbon Removal Sub-Model**
    - Reforestation (coupled to Forestry sub-model)
    - Soil carbon sequestration (no-till, biochar, perennial crops)
    - Wetland restoration (peatlands, marshes, mangroves)
    - Kelp/seaweed farming (emerging; small scale in model)
    - Permanence risk (fire, degradation; modeled as maintenance burden)

11. **Climate System Sub-Model**
    - Carbon cycle: atmospheric CO2 concentration based on emissions cumulative (simple impulse-response model)
    - Climate sensitivity: 3°C warming for 2× CO2 (IPCC AR5 best estimate)
    - Non-CO2 warming effects: methane radiative forcing, N2O, F-gas forcing
    - Cumulative forcing → temperature response via impulse-response approach
    - 20–30 year delay in temperature response (thermal inertia of oceans)

12. **Climate Damages Sub-Model**
    - Temperature-damage function (economic impact of warming)
    - Smooth curve: 1°C → ~0.5–1% GDP loss; 3°C → ~3–5% GDP loss (parameterized from empirical studies)
    - Crop yield impact: ~3–5% yield loss per °C warming in 2.5°C scenario
    - No tipping points / nonlinearities in base model (optional in advanced settings)
    - Feedback: higher temperature → lower GDP growth → lower energy demand (dampens emissions)

13. **Economic Growth & GDP Sub-Model**
    - Global GDP = Population × GDP per capita
    - Per-capita growth exogenously set (or optionally endogenous to climate damage)
    - Regional heterogeneity: poor countries higher growth, rich countries lower (convergence assumption)
    - GDP affects energy demand (elasticity ~0.7–1.0; each 1% GDP growth → 0.7–1% energy demand growth in baseline)
    - Optional damage feedback: climate impacts reduce GDP growth rate

14. **Energy Demand Sub-Model**
    - Driven by: Population, GDP/capita, Sectoral structure, Price (inverse elasticity ~0.3 short-term, ~0.7 long-term)
    - Price-demand feedback: higher energy prices → demand reduction (conserve/efficiency investments)
    - Rebound effect: efficiency improvements → cheaper energy → higher demand (typically 20–30% rebound)
    - Sectoral composition: transport ~25% of final energy, buildings ~25%, industry ~30%, other ~20%

15. **Energy Infrastructure Investment Sub-Model**
    - Investment in new capacity driven by: demand growth, fuel cost competition, policy incentives
    - Delays: 5–10 years from investment decision to operational capacity
    - Cost learning: technology cost reductions from deployment (progress ratios: solar 20% per double, wind 15%, batteries 12%, CCS unknown/high uncertainty)
    - Crowding out: limited construction capacity in early years (overheating feedback if too much simultaneous deployment)

16. **Methane Cycle Sub-Model**
    - Anthropogenic methane sources: livestock, rice paddies, gas infrastructure, landfills, coal mining (~390 Mtonnes CH4/yr ≈ 10 Gt CO2e/yr in CO2-eq forcing)
    - Methane lifetime: ~12 years (shorter than CO2 → faster turnover)
    - Methane warming potential: 28–36× CO2 over 100-year horizon (IPCC AR6)
    - Policy levers: livestock diet/breed improvements, biodigester deployment, leak detection & repair
    - Atmospheric feedback: higher CH4 concentration → reduced oxidation rate (saturation effect, minor)

17. **Carbon Cycle / Atmosphere Sub-Model**
    - Simple impulse-response atmosphere model (not full 3D GCM)
    - CO2 concentration calculated from cumulative emissions (Mauna Loa-calibrated)
    - Airborne fraction: ~45% of industrial CO2 stays in atmosphere; rest absorbed by oceans/land (variable with CO2 level)
    - CO2 residence time: ~100–300 years in troposphere; very long persistence if stored
    - Ocean uptake capacity: modeled implicitly; future uptake capacity not explicitly modeled (assumes sufficient)

18. **Policy Implementation & Delay Sub-Model**
    - Policy ramp-up: taxes/subsidies phase in over 10 years (sigmoid curve)
    - Capital stock delays: policies affect new capacity immediately but replace stock only over 20–50 year horizons
    - Behavioral lag: awareness and adoption delays for EVs, heat pumps, etc. (typically 5–15 years)
    - Technology deployment rate constraints: early phases slower due to supply chain bottlenecks (learning curve + scaling constraints)
    - Total policy effectiveness delay: typically 10–30 years before full impact realized

---

### CAPITAL STOCK TURNOVER RATES (Lifetimes by Technology)

En-ROADS models retirement (replacement) of capital stock endogenously based on technology lifetimes:

| Technology | Avg Lifetime | Turnover Notes |
|-----------|--------------|-----------------|
| Coal plants | ~30 years | Many plants 40–50 years in reality; model uses 30yr standard |
| Gas plants | ~30 years | Fastest to build, but lifecycle management varies |
| Nuclear plants | ~40 years | Can operate 60–80 years; model conservative |
| Oil refinery | ~35 years | Complex infrastructure; long-lasting |
| Wind turbines | ~25 years | Modern turbines; older models ~20 years |
| Solar PV | ~25 years | Degradation curve; ~80% capacity at 25yr |
| Hydro | ~50 years | Long-lasting dams; can operate 75+ years |
| Vehicles (cars) | ~15 years | Shorter in developed countries; ~20yr in poor regions |
| Heavy trucks | ~12 years | Heavy utilization; shorter life |
| Buses | ~12–15 years | High mileage; frequent replacement |
| Buildings (stock) | ~50 years | Mix of new construction + renovations; slow turnover |
| District heating | ~20–30 years | Pipelines ~50yr, boilers ~20yr |
| Batteries (grid storage) | ~10 years | Current tech; improving; future models 15–20yr likely |

**Key implication:** Because of long capital stock lifetimes, policies have delayed impacts. E.g., a coal phase-out decree takes 30 years to fully retire the fleet even with accelerated retirement policies.

---

### TIME DELAYS FOR MAJOR TRANSITIONS (Years)

| Transition | Delay Range | Driving Factors |
|-----------|------------|-----------------|
| Coal → Gas | 10–20 years | Gas plants build faster; coal plant retirements |
| Gas → Renewables | 20–30 years | Battery/storage learning curve + grid integration |
| Oil → EV transport | 15–25 years | Vehicle fleet turnover + battery cost learning |
| Buildings gas → heat pump | 20–40 years | Building retrofit cycle; reluctance to replace functioning systems |
| Deforestation → Reforestation | 50–100 years | Tree growth cycles; carbon payback period long |
| Policy enactment → capacity installed | 5–10 years | Permitting, financing, construction |
| Capacity installed → emissions impact | 5–20 years | Depends on displacement rate; fuel switching delays |

**Total policy lag example:** A carbon price announced in 2025 → takes 5 years to implement → 10 years for investment in renewables → 20 years for coal plant retirement. Full climate impact visible by 2050–2060 (25–35 year lag).

---

### CLIMATE SENSITIVITY & DAMAGE FUNCTION

**Climate Sensitivity (CS) in En-ROADS:**
- **Definition:** Temperature rise for 2× atmospheric CO2 (from 280 ppm → 560 ppm)
- **Value used:** 3°C (IPCC AR5 central estimate; range 1.5–4.5°C)
- **Implication:** Every doubling of CO2 concentration → 3°C warming
- **Current trajectory (2050):** ~420 ppm CO2 (1.5× preindustrial) → ~1.5°C warming by 2050 even without new policies
- **Optional setting:** User can adjust CS in advanced "Assumptions" menu (1.5–4.5°C range) to test sensitivity

**Damage Function (Economic Impact of Temperature):**

The model uses a smooth polynomial relationship between ΔT and GDP impact:

- **1°C warming:** ~0.5–1% of global GDP lost to climate damages
- **2°C warming:** ~2–3% of global GDP
- **3°C warming:** ~3–5% of global GDP
- **4°C+ warming:** Damages accelerate; estimated 5–10%+ GDP loss (model allows nonlinear damage curve in advanced settings)

**Damage sources included:**
- Extreme weather (hurricanes, floods, droughts)
- Sea level rise (coastal infrastructure)
- Agricultural yield decline
- Health impacts (heat stress, disease)
- Water scarcity
- Ecosystem collapse (economic value of services lost)

**Feedback loop:** Higher temperature → lower GDP growth → lower energy demand → slightly lower emissions (but effect is small; ~0.1°C reduction per 1% lower growth).

---

### CARBON CYCLE REPRESENTATION

En-ROADS uses a **simple carbon cycle** rather than full atmosphere-ocean GCM coupling:

1. **Anthropogenic Emissions Input:** Sum of energy CO2, land-use CO2, CH4 (in CO2-eq), N2O, F-gases, minus CDR removals
2. **Atmospheric CO2 Concentration:** Calculated from cumulative emissions using airborne fraction approach
   - ~45% of emitted CO2 remains in atmosphere (historical average)
   - ~55% absorbed by oceans/biosphere (variable with CO2 level)
   - Parameterized from ice-core & observational data
3. **CO2 Residence Time:** ~100–300 years in troposphere; longer in deep ocean
4. **Radiative Forcing:** CO2 concentration → radiative forcing (W/m²) via logarithmic relationship (IPCC formula)
5. **Temperature Response:** Radiative forcing → temperature via impulse-response model
   - ~1 W/m² forcing → ~0.3°C warming at equilibrium
   - Response time: 20–30 year half-life (thermal inertia of oceans)
6. **No explicit ocean carbonate chemistry:** pH/acidification not modeled; implicitly assumed sufficient buffering capacity

---

## Chapter 5: Views & Display Modes in En-ROADS Simulator

The En-ROADS web interface provides **multiple viewing modes** to understand model outputs:

### PRIMARY DISPLAY MODES

**1. Default / Main View**
- **Layout:** Three vertical panels
  - Left: All 19 sliders with icons, drag-able
  - Middle: One large chart (defaults to "Global Temperature Change")
  - Right: Four smaller related charts (change as slider is focused)
- **Interaction:** Drag slider → all charts update in 60ms (fast WebAssembly)
- **Export:** "Export Scenario" button → JSON file with all slider settings

**2. Scenarios Panel**
- **Trigger:** "Scenarios" button (top of page)
- **Content:** Pre-built named scenarios
  - "Baseline" (no new action)
  - "Nationally Determined Contributions (NDCs)" (Paris pledges)
  - "Plausible Pledges" (ambitious but achievable)
  - "Net Zero by 2050" (2°C-consistent pathway)
  - Custom user scenarios (save/load)
- **Comparison mode:** Overlay multiple scenarios' temperature outputs

**3. Focus Mode / Detail View**
- **Trigger:** Click on specific slider or chart
- **Content:** Expands one slider's controls, shows 6–8 related graphs, description text
- **Advanced settings:** "Use detailed settings" checkbox enables sub-sliders (e.g., separate coal tax/subsidy controls)

**4. Comparison View**
- **Trigger:** "Compare" button (top menu)
- **Content:** Side-by-side comparison of two scenarios with difference metrics
- **Metrics displayed:** ΔTemp vs. baseline, Δ Emissions, Δ Timeline to targets, cost estimates (if available)

**5. Graphs Menu**
- **Trigger:** "Graphs" dropdown (top right)
- **Categories:** 
  - Climate (Temperature, CO2, Forcing)
  - Emissions (by source, by sector)
  - Energy (primary/final, electricity, specific sectors)
  - Financial (costs, prices)
  - Socioeconomic (population, GDP, land use)
  - Model Comparison (vs. IPCC, others' scenarios)
  - Advanced / System Dynamics (flow diagrams, feedback loops)
- **Pinning:** User can pin 2–4 favorite charts to right panel for continuous monitoring

**6. Animation / Time-Series Playback**
- **Trigger:** Play button on year slider (2005–2100)
- **Effect:** Charts animate from 2005 to 2100; shows trajectory over time
- **Speed:** User-adjustable (0.5×–2× speed)

**7. Tooltip / Hover Information**
- **Hover icons:** (ⓘ) next to slider names
- **Content:** 1–2 sentence explanation of slider policy
- **Example (Coal slider):** "Discourage or encourage mining coal and burning it in power plants."

---

## Chapter 6: Iconography & Visual Vocabulary

En-ROADS uses consistent iconography and color conventions:

### SLIDER ICONS

| Slider | Icon | Unicode / Visual |
|--------|------|-----------------|
| Coal | Factory with smokestacks | 🏭 (dark gray factory) |
| Oil | Oil derrick | 🛢️ (pump jack) |
| Natural Gas | Factory / pipe | 🏭 (blue tones) |
| Bioenergy | Wheat / grain | 🌾 |
| Renewables | Wind turbine + Solar | ☀️⚡ (green colors) |
| Nuclear | Atom | ⚛️ (yellow/gold) |
| New Zero-Carbon | Lightbulb | 💡 or ⚙️ |
| Carbon Price | Dollar + Euro sign | $€ (mixed currency) |
| Transport EE | Car + gear | 🚗⚙️ |
| Transport Elec | EV car | 🔌🚗 (blue electric car) |
| Buildings EE | Building + gear | 🏢⚙️ |
| Buildings Elec | Lightning / electric | ⚡ (blue) |
| Population | People | 👥 |
| Economic Growth | Money / graph | 💰📈 |
| Agriculture | Cow or wheat | 🐄🌾 |
| Deforestation | Tree | 🌲 (green) |
| Waste | Trash can | 🗑️ |
| Nature-Based CDR | Tree + heart | 🌲💚 |
| Tech CDR | Filter / capture | 🔧⚙️ (industrial) |

### COLOR CONVENTIONS

**Energy sources in "Global Sources of Primary Energy" stacked area:**
- Coal: Dark gray or brown (#4A4A4A or #A0652F)
- Oil: Red (#D64545 or #FF6B6B)
- Natural Gas: Dark blue (#2C3E50 or #1F5B7D)
- Bioenergy: Pink / magenta (#E67E22 or #FF69B4)
- Nuclear: Yellow / gold (#F39C12 or #FFD700)
- Wind/Solar (Renewables): Light green (#27AE60 or #2ECC71)
- Hydro: Light blue / cyan (#3498DB)

**Scenarios:**
- Baseline: Black solid line
- Current User Scenario: Blue solid line (bright)
- Named scenarios: Different hues (purple for NDCs, green for Net Zero, etc.)
- Temperature targets: Red dashed lines (1.5°C, 2°C)

**Emissions charts:**
- Positive (emissions release): Red/brown shades
- Negative (CDR, emissions removal): Green shades
- Zero line: Black dashed

**Temperature:**
- Warming: Color scale from blue → red (0°C → 5°C+)
- 1.5°C target: Teal/cyan dashed line
- 2°C target: Blue dashed line
- Current path: Bold red line

### INTERACTIVE ELEMENTS

**Slider controls:**
- Drag handle (round circle): Centered, easy grab area
- Label: Slider name + current value (e.g., "Coal: -30%")
- Three-dot menu (⋮): Advanced settings toggle
- Undo/reset button (↺): Return to default

**Chart interactions:**
- Hover: Tooltip showing exact value, year, units
- Click legend: Toggle series on/off (e.g., hide "Baseline" to focus on "Current Scenario")
- Zoom: Pinch/scroll to zoom time axis (2020–2050 vs. full 2005–2100)
- Reset axes: Double-click to return to default zoom

**Modal cards / popups:**
- Scenario cards: Click to load preset scenario
- Information cards: Large tooltip on slider hover with policy examples, real-world data

### ANIMATION & MOTION

- **Slider movement:** Smooth curve animation (100ms) as value changes
- **Chart updates:** Line/area fills animate (200–500ms) for perception of change magnitude
- **Color transitions:** Smooth gradient from baseline color to scenario color
- **Play/pause animation:** Year by year changes visible over 5–10 seconds (user control)

---

## Chapter 7: Official Scenarios & Presets Library

En-ROADS ships with **5–7 official named scenarios** plus unlimited custom scenarios:

### BASELINE SCENARIO
- **Official name:** "Baseline" or "Current Policies"
- **Slider settings:** All sliders at default (status quo)
- **Interpretation:** World if societal & tech changes continue at current rate, without strengthening or weakening policies
- **2100 Temperature outcome:** ~2.9–3.0°C above preindustrial (varies with climate sensitivity assumption)
- **Headline metrics:**
  - Final primary energy: ~950 EJ/yr (vs. 600 EJ in 2020)
  - Coal: ~12% of supply (declining but persistent)
  - Renewables: ~45–50% of electricity
  - Cumulative emissions: ~2500–2700 Gt CO2 (2005–2100)

### NATIONALLY DETERMINED CONTRIBUTIONS (NDCs)
- **Official name:** "Nationally Determined Contributions"
- **Slider settings:** Aggressive but not maximum on each lever; represents aggregated global pledges under Paris Agreement
- **Interpretation:** All countries implement their stated climate pledges (IRA, net-zero goals, renewable targets)
- **2100 Temperature outcome:** ~2.3–2.5°C (vs. baseline ~3.0°C)
- **Implied settings:** Moderate coal/oil/gas discourage; renewables + nuclear encouraged; 50–60% transport electrification; strong efficiency gains
- **Caveat from docs:** "Does NOT represent what is most likely to happen; governments change priorities; policies can be altered or not implemented"

### PLAUSIBLE PLEDGES
- **Official name:** "Plausible Pledges" (Climate Interactive's assessment)
- **Slider settings:** More aggressive than NDCs; includes realistic policy acceleration
- **Interpretation:** Ambitious but achievable if policy ambition increases modestly over 2025–2050
- **2100 Temperature outcome:** ~2.0–2.1°C
- **Implied settings:** Strong coal phase-out; oil transport electrification; renewable leadership; carbon price $50–80/tonne
- **Key moves:** 
  - Coal: -50% (highly discouraged)
  - Oil: +50% (moderately discouraged)
  - Renewables: -60% (heavily subsidized)
  - Transport Elec: +70%
  - Buildings Elec: +60%
  - Carbon price: $50/tonne

### NET ZERO BY 2050
- **Official name:** "Net Zero 2050" or "1.5°C Consistent"
- **Slider settings:** Near-maximum on low-carbon levers; strong phase-out of high-carbon
- **Interpretation:** Pathway consistent with IPCC 1.5°C / 2°C goals; requires rapid decarbonization + CDR ramp-up
- **2100 Temperature outcome:** ~1.7–1.9°C (accounting for overshoot in 2050–2070, then CDR drawdown)
- **Implied settings:**
  - Coal: -100% (maximum discouragement / phase-out)
  - Oil: +100% (strong tax)
  - Renewables: -100% (maximum subsidy)
  - Nuclear: +50% (encouraged to provide baseload)
  - Transport Elec: +90%
  - Buildings Elec: +80%
  - Carbon price: $100–150/tonne
  - Tech CDR: 30–50% subsidy (ramp to 1–2 Gt CO2/yr by 2070)
  - Nature-Based CDR: 50% deployment

### USER CUSTOM SCENARIOS
- **Save mechanism:** "Save Scenario" button → name + description saved to browser (localStorage) or cloud (if account created)
- **Load mechanism:** Dropdown list of saved scenarios; click to restore all slider settings
- **Export:** JSON file containing all 19 slider values + scenario name + creation timestamp
- **Share:** Generate shareable URL with all slider values embedded (allows peer-to-peer scenario exchange)

---

## Chapter 8: Educational & Facilitation Patterns

### WORLD CLIMATE SIMULATION (WCS) WORKSHOP STRUCTURE

En-ROADS is designed as the centerpiece of structured 2–3 hour workshops:

**Phase 1: Setup (10–15 min)**
- Divide group into 5–6 teams (regions: USA, EU, China, India, Africa, Other)
- Each team gets a laptop with En-ROADS; shared projector shows template
- Facilitator explains carbon budget: "We have [X] Gt CO2 to emit to stay below 1.5°C by 2050"
- Baseline scenario projected: shows ~3°C outcome

**Phase 2: Exploration & Negotiation (45–60 min)**
- Each team controls sliders for their region (simplified versions of global sliders)
- Teams propose policies, see impact on global temperature
- Negotiate with other teams: "China, if you phase out coal by 2040, we'll subsidize your renewables"
- Refine collectively toward shared target (e.g., "Get to 2°C by 2050, minimal cost")
- Real-time feedback: temperature graph updates as sliders move

**Phase 3: Reflection & Debrief (20–30 min)**
- Compare final scenario to Baseline, NDCs, Net Zero
- Discuss: Which policies were hardest to implement? What feedback loops surprised you?
- Link to real-world: "The 'squeezing the balloon' dynamic you felt—that's why economists advocate carbon pricing over sector-specific policies"
- Optional exit survey: attitudes toward climate action, support for specific policies

**Typical outcome:** Teams rarely reach 1.5°C; usually land on 1.8–2.2°C, learning that comprehensive action is required.

---

### REFLECTION QUESTION PATTERNS

En-ROADS pedagogical approach emphasizes **systems thinking** through structured reflection:

**Example reflection prompts (from training materials):**

1. **Lever insufficiency:** "Why doesn't heavily subsidizing renewables alone avoid much future warming?"
   - *Expected insight:* Renewables displace fossil fuels, but demand for cheap electricity rises (rebound effect); coal/gas needed for baseload; efficiency + electrification of transport/buildings required for full impact

2. **Feedback loops:** "When coal is discouraged, what happens to natural gas? Why?"
   - *Expected insight:* "Squeezing the balloon"—reducing one fossil fuel increases demand for others unless all are taxed together or carbon price implemented

3. **Capital stock delays:** "Why does a carbon price take 20+ years to fully show up in the energy system?"
   - *Expected insight:* Coal plants last 30 years; vehicles 15 years; buildings 50 years; policies affect new infrastructure immediately but replace stock slowly

4. **Temperature overshoot & CDR:** "To reach 1.5°C without overshoot, what's required?"
   - *Expected insight:* Rapid near-term decarbonization (2020s–2040s) + large-scale CDR deployment (2050s+) to remove cumulative emissions

5. **Regional fairness:** "Should developing countries have lower carbon prices or longer phase-out timelines? Why?"
   - *Expected insight:* Historical responsibility, poverty reduction rights; En-ROADS allows exploration of differentiated policies

---

### PRE-BUILT LESSONS & ACTIVITIES

The En-ROADS Lesson Bank (https://learn.climateinteractive.org/) includes:

1. **"Energy, Economy, and Climate Basics"** (45 min)
   - Kaya Identity breakdown
   - Baseline scenario exploration
   - Individual policy lever demonstrations

2. **"World Climate Simulation (WCS)"** (2 hours, multi-team negotiation)
   - As described above; full structured game

3. **"Advanced Policy Design Workshop"** (3 hours)
   - Deep dive into carbon pricing vs. sector-specific policies
   - Cost-effectiveness analysis (cost per tonne CO2 avoided)
   - Equity implications of different policy mixes

4. **"Technology Breakthroughs & Carbon Removal"** (90 min)
   - Exploration of solar cost reduction scenarios
   - DACCS deployment pathways
   - Reforestation potential

5. **"Climate Justice & Equity"** (2 hours)
   - Analyze climate impact distribution (rich vs. poor nations)
   - Differentiated responsibility discussion
   - Just transition support mechanisms

**Estimated total lessons / modules:** 15–20 standalone lessons; combinable for semester-long courses

---

## Chapter 9: Exact Text Quotes — Voice & Tone for Park-ROADS Implementation

Below are **verbatim excerpts** from En-ROADS documentation that exemplify the pedagogical voice and tone:

**1. On model transparency (About En-ROADS page):**
> "Relative to many global energy and climate system models, En-ROADS returns results in a few seconds, is transparent in its mathematical logic, and allows you to interactively test hundreds of factors."

**2. On big messages (Coal slider page):**
> "Discouraging coal is a high leverage strategy for reducing future temperature change. Coal emits more carbon dioxide when it is burned than either oil or natural gas (coal has the highest carbon intensity)."

**3. On feedback loops (Oil slider page):**
> "When oil is taxed, notice what happens to coal and gas in response. Unless there are restrictions on coal and gas, their demand will go up in response to expensive oil. We call this the 'squeezing the balloon' problem—reducing fossil fuel emissions in one area causes them to pop up in another."

**4. On capital stock delays (Renewables slider page):**
> "Delays. It takes time for the subsidies and encouragement of renewables to show up in installed capacity. New energy infrastructure is only added as demand grows or as the old infrastructure is retired and makes space for new infrastructure (this is known as 'capital stock turnover delays'). The new infrastructure takes time to build."

**5. On policy effectiveness (Carbon Price slider page):**
> "Pricing carbon is a high leverage strategy, as it both reduces the carbon intensity of the energy supply and reduces the overall energy demand."

**6. On equity (Coal slider equity section):**
> "Taxing coal or removing coal subsidies can raise energy costs for households and businesses that rely on coal for energy needs. Low-income communities often suffer the worst health impacts yet make up the majority of individuals who produce coal. Providing pathways for these people to find new jobs will be essential."

**7. On rebound effects (Transport EE page):**
> "Price-Demand Feedback. When energy prices are higher, people tend to use energy more efficiently and conserve energy."

**8. On system-wide interactions (Baseline Scenario page):**
> "The En-ROADS model emphasizes the system-wide interactions of policies. Behind the simulator is an extensive study of the latest research literature on factors such as delay times, progress ratios, price sensitivities, historical growth of energy sources, and energy efficiency potential."

**9. On realism of baseline (Baseline Scenario page):**
> "The Baseline Scenario is designed to be a reasonable starting point from which to test various changes in policies and assumptions to see the impacts on our global climate. It is not a forecast of what is most likely to happen."

**10. On realistic ambition (Carbon Price slider page, Clean Electricity Standard note):**
> "Clean Electricity Standards only affect part of the energy system, and so their leverage depends on being used in conjunction with electrification of transport and buildings and industry."

---

## Chapter 10: 15 Concrete Improvements for Park-ROADS v1.9 (with En-ROADS Inspiration)

Park-ROADS is an industrial park digital transformation simulator. Below are 15 feature/UX improvements inspired by En-ROADS, adapted for 7 stakeholders + 35 indicators + DTSI (Days To Significant Impact) as headline metric:

### IMPROVEMENT 1: Primary Headline Metric (like En-ROADS "Global Temperature Change")

**What to add:**
- **DTSI Gauge** (Days To Significant Impact): Days until 10% operational efficiency gain achieved (main metric, always visible, top-right)
- Analogy: En-ROADS always shows temperature in °C at top-right; Park-ROADS should show DTSI in bright green/red color-coded box

**En-ROADS inspiration:**
> "Relative to many global energy and climate system models, En-ROADS returns results in a few seconds, is transparent in its mathematical logic"
- Park-ROADS should return DTSI projection in real-time (milliseconds) as stakeholders adjust levers

**Implementation:**
- DTSI = f(sum of all lever impacts weighted by capital stock turnover in parks)
- If baseline DTSI = 1825 days (5 years), target is <365 days (1 year)
- Color scale: Red (>2 years) → yellow (1–2 years) → green (<1 year)

---

### IMPROVEMENT 2: Stakeholder-Centric Views (like En-ROADS "Compare" mode)

**What to add:**
- **Stakeholder view filter:** Dropdown to show only metrics relevant to selected stakeholder (Facilities Mgr, Tenant, Local Authority, Finance, HR, Sustainability Officer, Developer)
- Left sidebar shows: 3–5 KPIs most critical to that stakeholder
- Charts update to show stakeholder-specific winners/losers from each policy

**En-ROADS inspiration:**
> "En-ROADS is designed to be used interactively with groups where it can be the basis for scientifically rigorous conversations around addressing climate change."
- Park-ROADS should enable each stakeholder to see "their" perspective, building buy-in

**Implementation:**
- Facilities Mgr view: HVAC efficiency, maintenance cost, equipment lifespan impact
- Tenant view: Operating costs, comfort indices, lease compliance
- Finance view: ROI projections, upfront capex, payback period
- Local Authority view: Air quality, traffic congestion, stormwater impact
- HR view: Job creation in retrofits, training needs, labor hours required

---

### IMPROVEMENT 3: "Squeezing the Balloon" Dynamics Visualization

**What to add:**
- **Animated feedback loop diagram** when slider is changed
- Shows: "If you increase [HVAC efficiency], then [cooling costs ↓, occupancy demand ↑, total energy may increase by X%]"
- Like En-ROADS coal slider explanation, make feedback loops explicit and visual

**En-ROADS inspiration:**
> "When coal is discouraged, watch the brown area of Coal go down in the 'Global Sources of Primary Energy' graph. It is one of the most sensitive energy supplies to any increase in cost because unlike oil, coal can often be replaced by natural gas (for heating or electricity) or renewables (for electricity). 'Squeezing the Balloon.' When coal is discouraged, notice what happens to natural gas in response."

**Implementation:**
- Slider change triggers 3–5 second animated flow diagram
- Boxes: [Policy input] → [Direct effect] → [Rebound effect] → [Net outcome]
- Example: [Increase HVAC efficiency] → [Annual cooling energy -15%] → [Lower tenant operating costs, attracts more tenants, +8% occupancy] → [Net energy -7%]

---

### IMPROVEMENT 4: Capital Stock Turnover Delays (like En-ROADS docstring)

**What to add:**
- **"Time to Impact" slider annotation** on each policy lever
- Shows average delay in years until policy fully realized
- Transparency example: "HVAC retrofit: 3-year payback + 8-year capital turnover = 11-year full impact"

**En-ROADS inspiration:**
> "New energy infrastructure is only added as demand grows or as the old infrastructure is retired and makes space for new infrastructure (this is known as 'capital stock turnover delays'). The new infrastructure takes time to build."

**Implementation:**
- Each slider shows delay estimate in hover tooltip
- Chart of "Policy Impact Ramp-Up" (sigmoid curve, 10–20 year lag) optional in advanced settings
- Real-world example: "Parking lot conversion to green space: 2 years to plan & permit + 1 year to build + 5 years for landscape maturation = 8 years total"

---

### IMPROVEMENT 5: 35 Indicators Dashboard (like En-ROADS 100+ graphs)

**What to add:**
- **Categorized indicator library** accessible via "Indicators" menu
- 35 indicators grouped: Energy & Climate (8), Operations & Costs (9), Tenant Impact (6), Community & Environment (7), Financial (5)
- Users can select 4–6 to display simultaneously

**En-ROADS inspiration:**
> "There are over 100 output graphs available in En-ROADS that show data from different parts of the global energy and climate system, and they update as you move sliders within En-ROADS."

**Implementation:**
- **Energy & Climate:** GHG emissions (t CO2e/yr), renewable % of energy, thermal efficiency (kWh/m²), water use, grid demand peak
- **Operations & Costs:** Total operating cost ($/yr), energy cost ($/yr), maintenance cost, labor hours, equipment replacement schedule
- **Tenant:** Occupancy rate (%), revenue/m² ($), lease compliance score, comfort index (PMV/PPD), parking occupancy
- **Community:** Air quality (PM2.5 µg/m³), stormwater runoff (mm), traffic congestion (vehicles/min), job creation (FTE), local spend ($)
- **Financial:** NPV of improvements ($), payback period (years), sensitivity analysis ($/tonne CO2 avoided), financing cost, insurance impact

**Color coding:** Like En-ROADS (green = target met, yellow = progress, red = off-track)

---

### IMPROVEMENT 6: Kaya-Like Identity for Parks (Decomposition Framework)

**What to add:**
- **Park Energy Intensity Identity (PEID):**
  > GHG = Occupancy × Productivity ($/m²) × Energy per $GDP × Carbon intensity
  
  Where:
  - Occupancy = % of leasable space occupied
  - Productivity = revenue per m² (business intensity)
  - Energy per $productivity = energy/revenue (efficiency)
  - Carbon intensity = kg CO2 per kWh of energy mix
- **Visualization:** Kaya-style decomposition chart; users adjust each lever and see contribution to total GHG reduction

**En-ROADS inspiration:**
> "Going further, CO2 emissions from energy are driven by four factors, which is known as the Kaya Identity. Population, consumption (GDP/capita), energy intensity (energy use per dollar of GDP), and carbon intensity (CO2 emissions per unit of energy) are all multiplied together and the result is overall energy CO2 emissions."

**Implementation:**
- Stacked bar chart: each of 4 terms shown, year-over-year change highlighted
- "What if we achieved [X% productivity growth + Y% efficiency improvement]? → Z% GHG reduction"
- Real-world example: "Tenant mix (pharma vs. office) → different energy intensity → different impact of efficiency policy"

---

### IMPROVEMENT 7: Real-World Analogies in Slider Descriptions

**What to add:**
- **"Examples in practice" section** for every slider
- Real building/park retrofits with actual data points

**En-ROADS inspiration:**
> "United States: Replacing all coal-powered electricity in the US with solar power could save 52,000 lives per year, which is more than the number of people employed by the coal industry today."

**Implementation examples for Park-ROADS:**
- **HVAC Efficiency slider:** "Google Cloud data centers achieved 40% PUE [Power Usage Effectiveness] reduction; typical: 1.8 → 1.2. Your park: baseline 1.6 → potential 1.2 with chiller upgrade"
- **EV Charging slider:** "WeWork retrofitted 3 lots with 50 chargers; 12% tenant EV adoption in year 1 → 25% by year 3. Your park, if 100 tenants: 12 → 30 EVs"
- **Solar Canopy slider:** "Apple's solar carports (40 MW) offset 12,000 t CO2/yr; cost $50M = $4/watt. Your 5-acre parking: ~2.5 MW feasible, ~3,000 t CO2/yr, estimated $10M"

---

### IMPROVEMENT 8: Equity & Just Transition Callouts (like En-ROADS)

**What to add:**
- **"Impacts by stakeholder" box** for each major policy
- Shows: winners, losers, transition support needed

**En-ROADS inspiration:**
> "Taxing coal or removing coal subsidies can raise energy costs for households and businesses that rely on coal for energy needs. Low-income communities often suffer the worst health impacts yet make up the majority of individuals who produce coal. Providing pathways for these people to find new jobs will be essential."

**Implementation for parks:**
- **HVAC efficiency** → positive for building operators (lower costs), negative for lazy tenants (no longer accept warm offices); support needed: tenant communication + thermostat training
- **Parking reduction** → positive for site planning & environment, negative for commuters; support: EV chargers + transit subsidies + remote work incentives
- **Solar on roofs** → positive for utility bill, negative for roof access for repairs; support: equipment lifecycle planning

---

### IMPROVEMENT 9: Advanced Settings & "Use Detailed Settings" Toggle

**What to add:**
- **Novice vs. Expert mode sliders**
- Basic mode: 1 control per lever (like En-ROADS coal = single tax/subsidy value)
- Advanced: breakout into sub-sliders (e.g., "HVAC efficiency" → "chiller upgrade" + "controls optimization" + "building envelope" with separate ROI, timeline, vendor)

**En-ROADS inspiration:**
> "To adjust taxes and subsidies separately, enable 'use detailed settings' in the Coal advanced view."

**Implementation:**
- "Use detailed settings" toggle on each slider
- Example (HVAC Efficiency):
  - Basic: single "% improvement by 2030" slider (0–50%)
  - Detailed: 
    - Chiller replacement % (0–100%, $cost, 3-year payback)
    - Controls upgrade % (0–100%, $cost, 1-year payback)
    - Building envelope (0–100%, $cost, 10-year payback)
  - User can customize mix based on capital availability

---

### IMPROVEMENT 10: "Scenarios" Library & Preset Solutions

**What to add:**
- **Named scenario templates** (like En-ROADS Baseline, NDCs, Net Zero)
  - "Basic Efficiency" → small capex, slow impact
  - "Green Retrofit" → moderate capex, 3-year payback
  - "Carbon-Neutral Park 2030" → high capex, aggressive targets
  - "Tenant-First" → prioritize occupancy & comfort, lower GHG
  - "Landlord-Optimized" → maximize ROI over cost
- Users load a preset, adjust to taste, save custom scenario

**En-ROADS inspiration:**
> "Pre-built lessons (count + topics)" — En-ROADS ships with 5–7 named scenarios

**Implementation:**
- Dropdown: "Load Scenario" with 5 presets + "Create Custom"
- Each preset shows: total capex, annual savings, DTSI, stakeholder impacts
- Example: Load "Green Retrofit" → automatically sets sliders to: HVAC +40%, Solar +30%, Electrification +50%, Water efficiency +25% → shows DTSI = 450 days, ROI = 8 years, tenant satisfaction ↑, emissions ↓40%

---

### IMPROVEMENT 11: Sensitivity / Break-Even Analysis

**What to add:**
- **"What-if" analysis tool** for financial models
- Shows: "If electricity price increases 20%, how does payback period change?"
- Like En-ROADS climate sensitivity options, allow uncertainty exploration

**En-ROADS inspiration:**
> "We chose to construct the En-ROADS Baseline Scenario in this way because 'pledged' or 'announced' policies can be altered or never be implemented... you can use En-ROADS yourself to compare the globally averaged effects"

**Implementation:**
- Input sensitivity variables: electricity cost (±10–50%), labor cost, equipment cost, occupancy growth, discount rate
- Output: sensitivity tornado chart showing which variables most impact DTSI, payback, NPV
- Example: "DTSI is most sensitive to electricity price (±5 years for ±25% price change), then labor cost (±3 years)"

---

### IMPROVEMENT 12: Explainer Articles & Education Hub

**What to add:**
- **Knowledge base** with 10–15 explainers (like En-ROADS support.climateinteractive.org)
- Topics: "Capital Stock Turnover in HVAC Systems", "Heat Pump ROI Analysis", "Parking Lot Greening 101", "Tenant Demand Response Incentives"

**En-ROADS inspiration:**
> "A general support knowledge base at support.climateinteractive.org with frequently asked questions and a contact form"

**Implementation:**
- Links from slider tooltips to relevant explainer (e.g., HVAC efficiency slider → "HVAC Capital Stock Turnover & Retrofit Economics")
- 500–1000 word articles with real case studies
- Downloadable PDFs for presentations to stakeholders

---

### IMPROVEMENT 13: Multi-Stakeholder Negotiation Mode (WCS-style game)

**What to add:**
- **Negotiation game** for mixed teams (like En-ROADS World Climate Simulation)
- 5–7 teams representing park stakeholders; each controls 2–3 levers
- Goal: reach park-wide DTSI target (e.g., <200 days) by negotiating policy mix

**En-ROADS inspiration:**
> "The World Climate Simulation workshop structure (length, roles, sequence)" — 2–3 hour structured game

**Implementation:**
- Facilitator sets up: "Your park has 1M sqft, 500 tenants, needs to reach net-zero GHG by 2030. You have $50M capex budget and 7 years. Teams: Facilities, Tenants, Finance, Sustainability, Local Authority. Negotiate!"
- Each team controls levers relevant to their role:
  - Facilities: HVAC, lighting, renewable energy
  - Tenants: EV charging, water fixtures, behavior/engagement
  - Finance: capex allocation, financing instruments, vendor selection
  - Sustainability: carbon goals, certifications, reporting
  - Local Authority: zoning, incentives, permitting speed
- Real-time dashboard shows emerging impacts; teams see if they're on track to goal
- Optional scoring: cost per tonne CO2, stakeholder satisfaction, DTSI

---

### IMPROVEMENT 14: Visual Feedback & Animation of Lever Impact

**What to add:**
- **Animated flow diagram** showing how policy change ripples through park systems
- When HVAC efficiency slider moves, show: "HVAC energy -15% → operating cost -$X/yr → capital available for EV chargers (+10 chargers) → tenant EV adoption +5% → DTSI improvement -120 days"

**En-ROADS inspiration:**
> "Impact. When coal is discouraged, watch the brown area of Coal go down in the 'Global Sources of Primary Energy' graph... Renewables are also boosted slightly"
- Real-time visual updates showing relationships between levers

**Implementation:**
- Slider change → 2–3 second animation showing: direct impact (energy/cost change), indirect effects (demand shifts, occupancy impact), secondary benefits (health, mobility, property value)
- Color-coded arrows: green = positive, red = negative impact on DTSI, costs, or stakeholder satisfaction

---

### IMPROVEMENT 15: Exportable Scenario Report & Implementation Roadmap

**What to add:**
- **"Generate Report" button** → PDF or HTML showing:
  - All slider settings (current scenario)
  - 35 indicators (summary + detailed)
  - DTSI projection (with sensitivity range)
  - Implementation roadmap (prioritized by capital vs. effort vs. impact)
  - Stakeholder impact summary (winners/losers by group)
  - Financial summary (capex, annual savings, ROI, payback, NPV over 20-year horizon)
  - Carbon accounting (t CO2e/yr reduction by lever)
  - Real-world analogies & case studies

**En-ROADS inspiration:**
> "These experiences enable people to explore the long-term climate impacts of global policy and investment decisions."
- Park-ROADS should enable organizations to export their approved plan + business case

**Implementation:**
- Report template includes:
  - Scenario name, date, stakeholders involved
  - Executive summary (1 page): DTSI, total capex, annual savings, headline metrics
  - Roadmap table: Year 1–7 with milestones, capex schedule, expected benefits
  - Appendix: detailed indicator data, sensitivity analysis, comparison to preset scenarios
- Shareable link: scenario URL can be emailed; stakeholders open in browser to review/adjust

---

## CONCLUSION: Applying En-ROADS Pedagogy to Park-ROADS v1.9

En-ROADS succeeds through **clarity, interactivity, and systems thinking**:

1. **Single headline metric** (Global Temperature) always visible, updated in real-time
2. **Transparent equations** (Kaya Identity, carbon cycle) embedded in UI with plain-language explanations
3. **Feedback loops visualized** ("squeezing the balloon," rebound effects, capital stock delays) not hidden
4. **Equity integrated** (not afterthought) — every slider includes "Equity Considerations" section
5. **Real-world examples** concrete, with data ("EU ETS €80/tonne," "Toyota sold 19M hybrids")
6. **Educational scaffolding** (novice → expert; basic → detailed settings)
7. **Scenarios library** enabling exploration without blank-slate confusion

**Park-ROADS v1.9 should mirror these principles:**
- **DTSI as headline metric** (like En-ROADS temperature)
- **Park Energy Intensity Identity (PEID)** decomposition (like Kaya)
- **Stakeholder-centric views** (not one-size-fits-all)
- **Feedback loops animated** (policy cascades visible)
- **35 indicators curated** for different stakeholder questions (like En-ROADS 100+ graphs)
- **Real retrofit case studies** as examples (like En-ROADS coal/solar case studies)
- **Equity / just transition** integrated into every lever (like En-ROADS)
- **Negotiation game mode** for multi-stakeholder alignment (like WCS)
- **Exportable reports** enabling organizational commitment to roadmaps

This approach transforms Park-ROADS from a **black-box optimization tool** into a **transparent systems thinking platform**, building stakeholder understanding and buy-in for industrial park digital transformation.

---

**Total word count:** ~3,200 words (excluding this line)

---

## SOURCES

- [En-ROADS User Guide](https://docs.climateinteractive.org/projects/en-roads/en/latest/)
- [En-ROADS Climate Solutions Simulator](https://en-roads.climateinteractive.org)
- [En-ROADS Simulator Science](https://www.climateinteractive.org/en-roads/en-roads-simulator-science/)
- [En-ROADS Technical Reference](https://www.climateinteractive.org/en-roads-technical-reference)
- [Climate Interactive](https://www.climateinteractive.org)

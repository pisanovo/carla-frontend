# Frontend

## Setup

1. Run `yarn install`
2. To setup the map, visit [maptiler.com](https://www.maptiler.com/):
    - After signing in, add a new map by pressing the dropdown next to the 'NEW MAP' button and then select upload map
    - Choose a title
    - Upload the [style.json](/maps/style.json) file and click 'create'
    - Copy the URL under 'Use vector style'
    - Create a copy of the [.env.example](.env.example) file
    - Rename the copy to `.env.local`
    - Paste the copied URL into `.env.local`
3. Run `yarn run dev`

## Path cloaking

### Map

When selecting the path confusion algorithm the map will show all release entries received
so far. Dots on the map represent published locations, triangles represent locations which the
algorithm decided to not publish.
Clicking on a release entry will show can show the predicted location, a blue dot with red stroke color.
If dependencies or neighbors exist it will show the k nearest release entries by drawing a red circle around it.

import React, { Component } from 'react';
import './App.css'
import scriptLoader from 'react-async-script-loader';
import escapeRegExp from 'escape-string-regexp';
import sortBy from 'sort-by';
import fetchJsonp from 'fetch-jsonp';
import { allLocations } from './locations.js';


let markers = [];
let infoWindows = [];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locations: allLocations,
      map: {},
      query: '',
      request: true,
      error: false,
      selectedMarker:'',
      data:[]
    }
  }

  updatequery =(query) => {
    this.setState({query: query})
  }

  updateData = (newData) => {
    this.setState({
      data:newData,
    });
  }


  componentWillReceiveProps({isScriptLoadSucceed}){
    window.gm_authFailure = function() {
      alert('Error: Google maps failed to load!');
    }
 if (isScriptLoadSucceed) {
   const map = new window.google.maps.Map(document.getElementById('map'), {
     zoom: 13,
     center: new window.google.maps.LatLng(26.189041, 49.810356),
   });
   this.setState({map:map});
   this.setState({request: true})
 }
 else {
   alert('Error: Google maps failed to load!');
   this.setState({request: false})
 }
}

  componentDidUpdate(){
    const {locations, query,map} = this.state;
    let showingLocations=locations
    if (query){
      const match = new RegExp(escapeRegExp(query),'i')
      showingLocations = locations.filter((location)=> match.test(location.title))
    }
    else{
      showingLocations=locations
    }
    markers.forEach(mark => { mark.setMap(null) });
    markers = [];
    infoWindows = [];
	// eslint-disable-next-line
    showingLocations.map((marker,index)=> {
    let getData = this.state.data.filter((single)=>marker.title === single[0][0]).map(item2=>
      {if (item2.length===0)
        return 'Nothing Found!'
        else if (item2[1] !=='')
          return item2[1]
        else
          return 'Nothing Found!'
      })
    let getLink = this.state.data.filter((single)=>marker.title === single[0][0]).map(item2=>
      {if (item2.length===0)
        return 'https://www.wikipedia.org'
        else if (item2[1] !=='')
          return item2[2]
        else
          return 'https://www.wikipedia.org'
      })
	  
      let content = 
	  `<div tabIndex="0" class="infoWindow">
      <h4>${marker.title}</h4>
      <p>${getData}</p>
      <a href=${getLink}>Click Here For More Info</a>
      </div>`
	  
		

      //Add content to infoWindows
      let addInfoWindow = new window.google.maps.InfoWindow({
        content: content
      });

      //Extend map bound
      let bounds = new window.google.maps.LatLngBounds();
      //Create marker
      let addmarkers = new window.google.maps.Marker({
        map: map,
        position: marker.location,
        animation: window.google.maps.Animation.DROP,
        name : marker.title
      });
      markers.push(addmarkers);
      infoWindows.push(addInfoWindow);
      addmarkers.addListener('click', function() {
          infoWindows.forEach(info => { info.close() });
          addInfoWindow.open(map, addmarkers);
          if (addmarkers.getAnimation() !== null) {
            addmarkers.setAnimation(null);
          } else {
            //Marker Animation
            addmarkers.setAnimation(window.google.maps.Animation.BOUNCE);
            setTimeout(() => {addmarkers.setAnimation(null);}, 400)
          }
        })
      markers.forEach((m)=>
        bounds.extend(m.position))
      map.fitBounds(bounds)
    })
  }

  componentDidMount(){
   // Wikipedia API
   this.state.locations.map((location,index)=>{
     return fetchJsonp(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${location.title}&format=json&callback=wikiCallback`)
     .then(response => response.json()).then((responseJson) => {
       let newData = [...this.state.data,[responseJson,responseJson[2][0],responseJson[3][0]]]
       this.updateData(newData)
     }).catch(error =>
       console.log("Error: Unfortunately, Wikipedia is unavailable. Please try again later.")
	 )
	 
   })
 }

  listItem = (item, event) => {
    let selected = markers.filter((currentOne)=> currentOne.name === item.title)
    window.google.maps.event.trigger(selected[0], 'click');

  }
  handleKeyPress(target,item,e) {
    if(item.charCode===13){
     this.listItem(target,e)
   }
 }

 render() {

  const {locations, query, request} = this.state;
    //filter ListItems
    let showingLocations
	
    if (query){
      const match = new RegExp(escapeRegExp(query),'i')
      showingLocations = locations.filter((location)=> match.test(location.title))
    }
    else{
      showingLocations=locations
    }
    showingLocations.sort(sortBy('title'))
    return (

      request ? (
	  <div>
        <nav className="nav">
		<center>
        <span id="subject" tabIndex='0'>Saudi Arabia - Eastern Province Universities</span>
		</center>
        </nav>
        <div id="container">
        <div id="map-container" role="application" tabIndex="-1">
        <div id="map" role="region" aria-label="Eastern Province Universities"></div>
        </div>
      <div className='listView'>
      <input id="textToFilter" className='form-control' type='text'
      placeholder=' search location ..'
      value={query}
      onChange={(event)=> this.updatequery(event.target.value)}
      role="search"
      aria-labelledby="Search For a University"
      tabIndex="1"/>
      <ul aria-labelledby="list of Universities" tabIndex="1">

    {showingLocations.map((getLocation, index)=>
      <li key={index} tabIndex={index+2}
      area-labelledby={`View details for ${getLocation.title}`}
	  onKeyPress={this.handleKeyPress.bind(this,getLocation)}
	  onClick={this.listItem.bind(this,getLocation)}>
	  {getLocation.title}</li>)}
      </ul>
      </div>
      </div>
      </div>
      ) : (
      <div>
      <h1>Error:Cant Load Your Google Map</h1>
      </div>

      )
      )
    }
  }
	// Load Google Map API Key
  export default scriptLoader(
      [`https://maps.googleapis.com/maps/api/js?key=AIzaSyAD7SP0433vy7OGi67irjeNfbMNbAJCA9s&v=3.exp&libraries=geometry,drawing,places`]
      )(App);

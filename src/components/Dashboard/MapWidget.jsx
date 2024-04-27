import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import env from "../../envFile";

const loader = new Loader({
  apiKey: env.GOOGLE_MAP_API_KEY,
  version: "weekly",
  libraries: ["places"],
});

const mapOptions = {
  averageCenter: true,
  zoom: 5,
  center: { lat: 37.828724, lng: -122.355537 },
  panControl: false,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  overviewMapControl: false,
  rotateControl: false,
  fullscreenControl: false,
  markers: {},
};

function MapWidget({ properties }) {
  function initMap(google) {
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    const geocoder = new google.maps.Geocoder();
    const infoWindow = new google.maps.InfoWindow({
      content: "",
      disableAutoPan: true,
    });

    if (properties?.length) {
      const markers = [];
      properties.map((p, i) => {
        if (p?.latitude && p?.longitude) {
          const label = p?.address1;
          const marker = new google.maps.Marker({
            // icon: require("../../Assets/images/map-marker.svg").default,
            position: { lat: p?.latitude, lng: p?.latitude },
            label,
          });

          // markers can only be keyboard focusable when they have click listeners
          // open info window when marker is clicked

          const contentString = `<div class="row">
        <div class="col-5">
            <img style="height: 100%; width: 100%; overflow:hidden;" src="https://picsum.photos/150?image=641" alt="">
        </div>
        <div class="col-7 mt-3 overflow-auto" style="padding-left:0;">
            <span>${p?.address1}, ${p?.state}, ${p?.state} ${p?.zipcode}</span>
        </div>
      </div>`;

          marker.addListener("click", () => {
            map.panTo(marker.getPosition());
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
          });
          markers.push(marker);
        }
      });

      // Add a marker clusterer to manage the markers.
      new MarkerClusterer({ markers, map });
    }
  }

  // function initMap(google) {
  //   const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  //   const geocoder = new google.maps.Geocoder();
  //   const infoWindow = new google.maps.InfoWindow({
  //     content: "",
  //     disableAutoPan: true,
  //   });
  //   // Create an array of alphabetical characters used to label the markers.
  //   const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  //   // Add some markers to the map.

  //   var address = "2551 Vista Dr #B301, Juneau, Alaska 99801, USA";
  //   let marker;
  //   // geocoder.geocode({ address: address }, function (results, status) {
  //   //   if (status == "OK") {
  //   //     map.setCenter(results[0].geometry.location);
  //   //     marker = new google.maps.Marker({
  //   //       map: map,
  //   //       position: results[0].geometry.location,
  //   //     });
  //   //     console.log("HHH", marker);
  //   //   } else {
  //   //     alert("Geocode was not successful for the following reason: " + status);
  //   //   }
  //   // });

  //   const markers = locations.map((position, i) => {
  //     const label = labels[i % labels.length];
  //     const marker = new google.maps.Marker({
  //       // icon: require("../../Assets/images/map-marker.svg").default,
  //       position,
  //       label,
  //     });

  //     // markers can only be keyboard focusable when they have click listeners
  //     // open info window when marker is clicked

  //     const contentString = `<div class="row">
  //       <div class="col-5">
  //           <img style="height: 100%; width: 100%; overflow:hidden;" src="https://picsum.photos/150?image=641" alt="">
  //       </div>
  //       <div class="col-7 mt-3 overflow-auto" style="padding-left:0;">
  //           <span>Copy paste the HTML and CSS dsfwef dwweeeqe.</span>
  //       </div>
  //     </div>`;

  //     marker.addListener("click", () => {
  //       map.panTo(marker.getPosition());
  //       infoWindow.setContent(contentString);
  //       infoWindow.open(map, marker);
  //     });
  //     return marker;
  //   });

  //   // Add a marker clusterer to manage the markers.
  //   new MarkerClusterer({ markers, map });
  // }

  useEffect(() => {
    loader
      .load()
      .then((google) => {
        initMap(google);
      })
      .catch((e) => {
        console.log("Map Error ", e);
        // do something
      });
  }, [properties]);
  return (
    <div id="map" style={{ position: "absolute", height: "100%", width: "100%", borderRadius: "16px", left: 0 }} />
  );
}

export default MapWidget;

import React, {useState, useEffect, useRef} from 'react';
import { StyleSheet, Button, Text, Alert, TextInput, View, StatusBar, Image, KeyboardAvoidingView} from 'react-native';

import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import MapView, {Marker, AnimatedRegion} from 'react-native-maps';
import * as SQLite from 'expo-sqlite';
import Database from './DatabaseManager.js';
import { NavigationEvents } from 'react-navigation';

export default function MapScreen(props) {

  const weatherApiKey = '';
  const mapQuestApiKey = '';

  const [searchText, setSearchText] = useState('');
  const [lat, setLatitude] = useState(0);
  const [long, setLongitude] = useState(0);

  const[tempature, setTempature] = useState(0);
  const[weather, setWeather] = useState('');
  const[weatherImage, setWeatherImage] = useState('');
  const[locationName, setLocationName] = useState('');

  const db  = Database.getConnection();

  useEffect(() => {
    /*db.transaction(tx  => {
      tx.executeSql(
      'drop table favorites;'
      )});*/
    //Initialize database table
    db.transaction(tx  => {
      tx.executeSql(
      'create table if not exists favorites (id  integer primary key not null, location text unique, latitude double, longitude double);'
      )});

    getUsersLocation();
  },[]);

  //Save item to database
  const saveItem = (params) => {
    if(params.locationName == '') {
      Alert.alert("Can't add favorite!");
      return;
    }
    db.transaction( tx => {
      tx.executeSql('insert or ignore into favorites (location, latitude, longitude) values (?, ?, ?);',
        [params.locationName, params.latitude, params.longitude]);
    }, null, null);
  }

  const getUsersLocation = async () => {
    const {status} = await Permissions.askAsync(Permissions.LOCATION);
    if(status !== 'granted') {
      Alert.alert("No permission to access location")
    } else {
      let location = await Location.getCurrentPositionAsync();

      let event = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      updateLocation(event);
    }
  };

  const searchWeatherByLocation = async (name) => {
    try {
      const response = await fetch('http://api.openweathermap.org/data/2.5/weather?q=' + name + '&units=metric&APPID=' + weatherApiKey);

      const data = await response.json();

      updateWeather(data);
    } catch (error) {
      console.log(error);
    }
  };

  const getLocationDataByCoordinates = async (latidute, longitude) => {
    const url = 'http://www.mapquestapi.com/geocoding/v1/reverse?key=' + mapQuestApiKey + '&location=' + latidute + ',' + longitude;
    const response = await fetch(url);

    const data = await response.json();

    let lat = data.results[0].locations[0].latLng.lat;
    let long = data.results[0].locations[0].latLng.lng;
    setLatitude(lat);
    setLongitude(long);

    searchWeatherByLocation(data.results[0].locations[0].adminArea5);
  }
  const getLocationDataByName = async () => {
    const url = 'http://www.mapquestapi.com/geocoding/v1/address?key=' + mapQuestApiKey + '&location=' + searchText;
    const response = await fetch(url);

    const data = await response.json();

    let lat = data.results[0].locations[0].latLng.lat;
    let long = data.results[0].locations[0].latLng.lng;
    setLatitude(lat);
    setLongitude(long);

    let event = {
      latitude: lat,
      longitude: long
    };

    animateMapTransition(event);
    searchWeatherByLocation(data.results[0].locations[0].adminArea5);
  };

  const updateWeather = (data) => {
    if(data.cod === 200) {
      //Weather data found
      setTempature(data.main.temp);
      setWeather(data.weather[0].main);
      setLocationName(data.name);
      var iconUrl = "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";
      setWeatherImage(iconUrl);
    } else {
      //Error fetching weather data
      setTempature(0);
      setWeather('');
      setLocationName('');
      setWeatherImage('');
    }
  };

  const updateLocation = (event) => {
    console.log("called1");
    if(event == '') {
      return;
    }
    console.log("called2");
    setLatitude(event.latitude);
    setLongitude(event.longitude);
    
    animateMapTransition(event);
    getLocationDataByCoordinates(event.latitude, event.longitude);
  };

  const animateMapTransition = (event) => {
    let region = {
      latitude: parseFloat(event.latitude),
      longitude: parseFloat(event.longitude),
      latitudeDelta: 5,
      longitudeDelta: 5
    };
    this.mapView.animateToRegion(region, 1000);
  }
  return (
    <View style={styles.container}>
      <NavigationEvents onDidFocus={() => updateLocation(props.navigation.getParam('event', ''))}/>
      <View style={styles.TitleContainer}>
        <Text style={{textAlign: 'center', fontSize: 30, fontWeight: 'bold', margin: 5}}>Weather Mapped</Text>
        <Text style={{textAlign: 'center'}}>Start by searching for a city or tapping a location on a map</Text>
      </View>
      <View style={styles.SearchContainer}>
        <TextInput 
              style={styles.Input} 
              placeholder='Search city'
              value={searchText}
              onChangeText={(text) => setSearchText(text)}>
        </TextInput>
        <Button title="Find" onPress={getLocationDataByName}></Button>
      </View>

      { locationName !== '' ? (
        <View style={styles.WeatherContainer}>
          <Text style={styles.TextHeader}>{locationName}</Text>
          <View style={{flexDirection: 'column'}}>
            <Text style={styles.TextStyle}>{tempature + "°C"}</Text>
            <Text style={styles.TextStyle}>{weather}</Text>
            <Button title="Add" onPress={() => saveItem({locationName: locationName, latitude: lat, longitude: long})}/>
          </View>
        </View>
        ) : (
          <View></View>
        )}

      <MapView style={{flex: 8}} onPress={
          (event) => updateLocation(event.nativeEvent.coordinate)} ref={ref => (this.mapView = ref)}>

        <Marker coordinate={{latitude: lat, longitude: long}}>
            <View style={{alignItems: "center", justifyContent: "center"}}>
              <Image source={{uri: weatherImage}} style={{height: 35, width:35 }} />
            </View>
          </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingBottom: 0
  }, TitleContainer: {
    flex: 1,
    marginTop: StatusBar.currentHeight + 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 30,
    marginRight: 30
  }, WeatherContainer: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: 20,
  }, SearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5
  }, TextHeader: {
    fontSize: 30,
    fontWeight: 'bold'
  }, TextStyle: {
    fontSize: 25,
    textAlign: 'center'
  }, MarkerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  }, Input: {
    width: '80%',
    height: '50%',
    margin: 5,
    borderColor: '#555555', 
    borderWidth: 1
  }
});

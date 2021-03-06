import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, Alert, ToastAndroid, View, StatusBar, Image} from 'react-native';

import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import MapView, {Marker} from 'react-native-maps';
import Database from './DatabaseManager.js';
import { NavigationEvents } from 'react-navigation';
import { Card, SearchBar, Button, Icon } from 'react-native-elements';
import{ Ionicons } from '@expo/vector-icons';

export default function MapScreen(props) {

  //Remember to add api keys for the WeatherApi & MapQuestApi
  const weatherApiKey = '';
  const mapQuestApiKey = '';

  const [searchText, setSearchText] = useState('');
  const [lat, setLatitude] = useState(0);
  const [long, setLongitude] = useState(0);

  const[tempature, setTempature] = useState(0);
  const[weather, setWeather] = useState('');
  const[weatherImage, setWeatherImage] = useState('');
  const[locationName, setLocationName] = useState('');

  //Show all favorite locations as Favorites on the map
  const[favoritesArray, setFavoritesArray] = useState([]);

  const db  = Database.getConnection();

  useEffect(() => {

    //For testing
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
    updateFavorites();
  },[]);

  //Favorite or unfavorite location
  const favoriteLocation = (params) => {

    if(params.locationName == '') {
      Alert.alert("Can't add favorite!");
      return;
    }

    //Remove location from the database
    if(isLocationAlreadyFavorited(params.locationName)) {
      db.transaction( tx => {
        tx.executeSql('delete from favorites where location = ?;',[params.locationName]);
      }, null, updateFavorites);
      ToastAndroid.show(params.locationName + " removed from favorites", ToastAndroid.LONG);
      return;
    }

    //Save location to the database
    db.transaction( tx => {
      tx.executeSql('insert or ignore into favorites (location, latitude, longitude) values (?, ?, ?);',
        [params.locationName, params.latitude, params.longitude]);
    }, null, updateFavorites);
    ToastAndroid.show(params.locationName + " added to favorites", ToastAndroid.LONG);
  }

  const isLocationAlreadyFavorited = (location) => {

    for(var i=0; i<favoritesArray.length;i++){
      if(location === favoritesArray[i].location) {
        return true;
      }
    }

    return false;
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

  const getLocationDataByCoordinates = async (latitude, longitude) => {
    const url = 'http://www.mapquestapi.com/geocoding/v1/reverse?key=' + mapQuestApiKey + '&location=' + latitude + ',' + longitude;
    const response = await fetch(url);

    const data = await response.json();

    let lat = data.results[0].locations[0].latLng.lat;
    let long = data.results[0].locations[0].latLng.lng;
    setLatitude(lat);
    setLongitude(long);

    searchWeatherByLocation(data.results[0].locations[0].adminArea5);
  }
  const getLocationDataByName = async () => {
    const url = 'http://www.mapquestapi.com/geocoding/v1/address?key=' + 
        mapQuestApiKey + '&location=' + searchText;

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
      var iconUrl = "http://openweathermap.org/img/wn/" + data.weather[0].icon + ".png";
      setWeatherImage(iconUrl);
    } else {
      //Error fetching weather data
      setTempature(0);
      setWeather('');
      setLocationName('');
      setWeatherImage('');
      ToastAndroid.show("Error: could not fetch weather data", ToastAndroid.LONG);
    }
  };

  const updateLocation = (event) => {
    if(event == '') {
      return;
    }
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

  const updateFavorites = () => {
    db.transaction( tx => {
      tx.executeSql('select * from favorites;', [], (_, {rows}) => {
          setFavoritesArray(rows._array);
        }
      );
    });
  }

  return (
    <View style={styles.container}>
      <NavigationEvents onWillFocus={() => {
        updateFavorites();
        updateLocation(props.navigation.getParam('event', ''));
        props.navigation.setParams({event: ''});
    }}/>
      <View style={styles.TitleContainer}>
        <Text style={{textAlign: 'center', fontSize: 30, fontWeight: 'bold', margin: 5}}>Weather Mapped</Text>
        <Text style={{textAlign: 'center'}}>Start by searching for a city or tapping a location on a map</Text>
      </View>
      <View style={styles.SearchContainer}>
        <SearchBar
              platform='android'
              returnKeyType='search'
              searchIcon={null}
              containerStyle={styles.SearchBar}
              placeholder='Search city'
              value={searchText}
              onSubmitEditing={getLocationDataByName}
              onChangeText={(text) => setSearchText(text)}/>
        <Icon name="md-search" type='ionicon' raised
          reverseColor="#ffffff" color="#000000" onPress={getLocationDataByName}/>
      </View>

      { locationName !== '' ? (
        <Card title={locationName}>
          <View style={styles.WeatherInfo}>
            <Text style={styles.TextStyle}>{tempature + "°C"}</Text>
            <Text style={styles.TextStyle}>{weather}</Text>
            <Button buttonStyle={isLocationAlreadyFavorited(locationName) ? styles.ButtonActive : styles.ButtonInactive} icon={<Ionicons name='md-heart' size={25} color={'#ffffff'}/>} 
              onPress={() => favoriteLocation({locationName: locationName, latitude: lat, longitude: long})}></Button>
          </View>
        </Card>
        ) : (
          <View></View>
        )}

      <MapView style={{flex: 1, marginTop: 30}} onPress={
          (event) => updateLocation(event.nativeEvent.coordinate)} ref={ref => (this.mapView = ref)}>
          
          {favoritesArray[0] != null && favoritesArray.map((marker, index) => (
            <MapView.Marker
                opacity={ 
                  //Hide favorite marker if it's overlapping with the default marker
                  (weatherImage !== '' && marker.location === locationName) ? 0 : 1
                }
                onPress={() => updateLocation({latitude: marker.latitude, longitude: marker.longitude})}
                key = {index}
                coordinate = {{
                    latitude: marker.latitude,
                    longitude: marker.longitude
                }}
                title = { marker.location }
            />
          ))}

        <Marker coordinate={{latitude: lat, longitude: long}} title={locationName}>
            <View style={{alignItems: "center", justifyContent: "center"}}>
              { weatherImage !== '' ? (
              <View style={styles.MarkerBackground}>
                <Image source={{uri: weatherImage}} style={{height: 40, width: 40}} />
              </View>
              ) : (
                <View style={{opacity: 0}}/>
              )}
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
    height: 80,
    marginTop: StatusBar.currentHeight + 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 30,
    marginRight: 30,
  }, WeatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  } , SearchContainer: {
    height: 50,
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
  }, SearchBar: {
    width: '80%'
  }, MarkerBackground: {
    width: 40,
    height: 40,
    borderRadius: 40 / 2,
    //Light blue background works best with the weather icons
    backgroundColor: 'rgba(150, 150, 255, 0.8)', 
    borderColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  }, ButtonActive: {
    backgroundColor: 'rgb(255, 0, 0)', 
  }, ButtonInactive: {
    backgroundColor: 'rgb(150, 150, 150)', 
  }
});

import React, {useState, useEffect} from 'react';
import { StyleSheet, Button, Text, TextInput, View, Image, KeyboardAvoidingView} from 'react-native';

import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import MapView, {Marker, AnimatedRegion} from 'react-native-maps';

export default function MapScreen() {
  
  const [searchText, setSearchText] = useState('');
  const [lat, setLatitude] = useState(0);
  const [long, setLongitude] = useState(0);

  const[tempature, setTempature] = useState(0);
  const[weather, setWeather] = useState('');
  const[weatherImage, setWeatherImage] = useState('');
  const[locationName, setLocationName] = useState('');

  useEffect(() => {
    getUsersLocation();
  },[]);

  const getUsersLocation = async () => {
    const {status} = await Permissions.askAsync(Permissions.LOCATION);
    if(status !== 'granted') {
      Alert.alert("No permission to access location")
    } else {
      let location = await Location.getCurrentPositionAsync();

      let lat = location.coords.latitude;
      let long = location.coords.longitude;
      setLatitude(lat);
      setLongitude(long);
      getLocationDataByCoordinates(lat, long);
    }
  };

  const searchWeatherByLocation = async (name) => {
    try {
      var apiKey = '';

      //Get weather data based on the coordinates
      const response = await fetch('http://api.openweathermap.org/data/2.5/weather?q=' + name + '&units=metric&APPID=' + apiKey);

      const data = await response.json();

      updateWeather(data);
    } catch (error) {
        Alert.alert("Error", error);
    }
  };

  const getLocationDataByCoordinates = (latidute, longitude) => {
    var apiKey = '';
    const url = 'http://www.mapquestapi.com/geocoding/v1/reverse?key=' + apiKey + '&location=' + latidute + ',' + longitude;
    
    fetch(url)
    .then((response) => response.json())
    .then((responseJson) => {

      let lat = responseJson.results[0].locations[0].latLng.lat;
      let long = responseJson.results[0].locations[0].latLng.lng;
      setLatitude(lat);
      setLongitude(long);

      searchWeatherByLocation(responseJson.results[0].locations[0].adminArea5);
    })
    .catch((error) => {
      Alert.alert("Error", error);
    });
  }
  const getLocationDataByName = () => {
    var apiKey = '';
    const url = 'http://www.mapquestapi.com/geocoding/v1/reverse?key=' + apiKey + '&location=' + searchText;
    fetch(url)
    .then((response) => response.json())
    .then((responseJson) => {

      let lat = responseJson.results[0].locations[0].latLng.lat;
      let long = responseJson.results[0].locations[0].latLng.lng;
      setLatitude(lat);
      setLongitude(long);

      searchWeatherByLocation(searchText);
    })
    .catch((error) => {
      Alert.alert("Error", error);
    });
  };

  const updateWeather = (data) => {
    setTempature(data.main.temp);
    setWeather(data.weather[0].main);
    setLocationName(data.name);
    var iconUrl = "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";
    setWeatherImage(iconUrl);
  };

  const updateLocation = (event) => {
    setLatitude(event.latitude);
    setLongitude(event.longitude);

    getLocationDataByCoordinates(event.latitude, event.longitude);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>
      <MapView style={styles.MapStyle} onPress={
          (event) => updateLocation(event.nativeEvent.coordinate)}>
        <Marker coordinate={{latitude: lat, longitude: long}}>
            <View style={{alignItems: "center", justifyContent: "center"}}>
              <Image source={{uri: weatherImage}} style={{height: 35, width:35 }} />
            </View>
          </Marker>
      </MapView>
      { locationName !== '' ? (
        <View style={styles.WeatherContainer}>
          <Text style={styles.TextHeader}>{locationName}</Text>
          <View style={{flexDirection: 'column'}}>
            <Text style={styles.TextStyle}>{tempature + "°C"}</Text>
            <Text style={styles.TextStyle}>{weather}</Text>
          </View>
        </View>
        ) :(
          <View></View>
        )}
      <View style={styles.SearchContainer}>
        <TextInput 
              placeholder='Search location'
              style={styles.Input} 
              value={searchText}
              onChangeText={(text) => setSearchText(text)}>
        </TextInput>
        <Button style={{flex: 1}} title="Find" onPress={getLocationDataByName}></Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  }, MapStyle: {
    flex: 8
  }, WeatherContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: 20,
  }, SearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 4,
    height: 30,
    margin: 5,
    borderColor: '#555555', 
    borderWidth: 1
  }
});

import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator} from 'react-navigation-tabs';

import{ Ionicons } from'@expo/vector-icons';

import MapScreen from './MapScreen';
import FavoritesScreen from './FavoritesScreen';

export default function App() {
  
  const Navigator = createBottomTabNavigator({
    Map: {screen: MapScreen},
    Favorites: {screen: FavoritesScreen}
  }, {
    //Add some margin to the top, so the statusbar won't overlap with the AppContainer
    tabBarOptions: { 
      showIcon: true,
      activeTintColor: '#ffffff',
      inactiveTintColor: '#cccccc',
      style: { 
        marginTop: StatusBar.currentHeight,
        backgroundColor: '#ff0000',
      }
    },
    defaultNavigationOptions: ({navigation}) => ({
        tabBarIcon: ({focused, tintColor}) => {
          const{routeName} = navigation.state;

          if (routeName === 'Map') {
            return <Ionicons name='md-map' size={25} color={tintColor}/>;
          } else if (routeName === 'Favorites') {
            return <Ionicons name='md-pin' size={25} color={tintColor}/>;
          }
        }
      }) 
  });

  const AppContainer = createAppContainer(Navigator);
  return (
    <AppContainer/>
  );
}
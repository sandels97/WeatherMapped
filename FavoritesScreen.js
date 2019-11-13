import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, Alert, View, FlatList, Button, ToastAndroid, StatusBar } from 'react-native';
import Database from './DatabaseManager.js';
import { NavigationEvents } from 'react-navigation';
import { ListItem } from 'react-native-elements';

export default function FavoritesScreen(props) {

  const db = Database.getConnection();

  const [data, setData] = useState([]);

  useEffect(() => {
      updateList();
  },[]);

  const deleteItem = (name,id) => {
    db.transaction( tx => {
      tx.executeSql('delete from favorites where id = ?;',[id]);
    }, null, updateList);
    ToastAndroid.show(name + " removed from favorites", ToastAndroid.LONG);
  }

  const updateList = () => {
    db.transaction( tx => {
      tx.executeSql('select * from favorites;', [], (_, {rows}) => {
          setData(rows._array);
        }
      );
    });
  }
  const showConfirmationDialog = () => {
    Alert.alert(
      'Unfavorite all', 'Are you sure?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'Unfavorite', 
        onPress: () => clearFavorites()},
      ],
      {cancelable: false},
    );
  }
  const clearFavorites = () => {
    db.transaction(tx => {
      tx.executeSql('delete from favorites;',[]);
    }, null, updateList);
    ToastAndroid.show("Favorites cleared", ToastAndroid.LONG);
  }
  return (
    <View style={styles.container}>
      <View style={styles.TitleContainer}>
        <Text style={styles.HeaderText}>Favorites</Text>
        <Text style={{textAlign: 'center'}}>Tap location to navigate to it in the map or press and hold it to unfavorite it</Text>
      </View>
      
      <NavigationEvents onWillFocus={() => updateList()}/>
      <View style={styles.list}>
        <FlatList data={data} 
          renderItem={({item}) => 
            <ListItem 
              title={item.location} 
              onPress={() => { props.navigation.navigate('Map', {event: item});}}
              onLongPress={() => deleteItem(item.location, item.id)}
              bottomDivider
              topDivider/>
          }/>
      </View>
      {data.length > 0 ? (
        <View style={styles.SettingsContainer}>      
          <Button title="Unfavorite all" onPress={() => showConfirmationDialog()}/>
        </View>
      ) : (
        <View/>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },TitleContainer: {
    height: 80,
    marginTop: StatusBar.currentHeight + 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 30,
    marginRight: 30,
    marginBottom: 30
  }, list: {
    flex: 3,
    width: '90%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  }, HeaderText: {
    textAlign: 'center', 
    fontSize: 30, 
    fontWeight: 'bold', 
    margin: 5
  }, SettingsContainer: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
  }
});

import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, FlatList, Button } from 'react-native';
import * as SQLite from 'expo-sqlite';
import Database from './DatabaseManager.js';
import { NavigationEvents } from 'react-navigation';

export default function FavoritesScreen(props) {

  const db = Database.getConnection();

  const [data, setData] = useState([]);

  useEffect(() => {
      updateList();
  },[]);

  const deleteItem = (id) => {
    db.transaction( tx => {
      tx.executeSql('delete from favorites where id = ?;',[id]);
    }, null, updateList);
  }

  const updateList = () => {
    db.transaction( tx => {
      tx.executeSql('select * from favorites;', [], (_, {rows}) => {
          setData(rows._array);
        }
      );
    });
  }

  return (
    <View style={styles.container}>
      <Text>FavoritesScreen</Text>
      <NavigationEvents onDidFocus={() => updateList()}/>
      <View style={styles.list}>
        <FlatList data={data} renderItem={({item}) => 
          <View>
            <Text>{item.location}</Text>
            <Text>{item.latitude}</Text>
            <Text>{item.longitude}</Text>
            <Button title='Navigate' onPress={() => {
                props.navigation.navigate('Map', {event: item});
              }}/>
          </View>
          }/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100
  },
});

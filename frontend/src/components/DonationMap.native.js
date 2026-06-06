import React from 'react';
import MapView, { Marker } from 'react-native-maps';

export default function DonationMap({ latitude, longitude, title, description, style }) {
  return (
    <MapView
      style={style}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker coordinate={{ latitude, longitude }} title={title} description={description} />
    </MapView>
  );
}

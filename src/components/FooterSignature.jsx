import { View, Text, Linking } from 'react-native'

export default function FooterSignature({ couleurTexte, couleurLien }) {
  return (
    <View style={{ paddingVertical: 8, alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color: couleurTexte ?? '#6b7280' }}>
        {'Propulsé par '}
        <Text
          style={{ color: couleurLien ?? '#3b82f6', textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL('https://www.axelgregoire.fr')}
        >
          Axel Grégoire
        </Text>
      </Text>
    </View>
  )
}

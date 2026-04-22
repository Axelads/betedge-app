import React, { forwardRef } from 'react'
import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const LABEL_SPORT = {
  football:   '⚽ Football',
  tennis:     '🎾 Tennis',
  basketball: '🏀 Basketball',
  rugby:      '🏉 Rugby',
  autre:      '🏆 Autre',
}

const LABEL_TAG = {
  forme_domicile_forte:    'Dom. fort',
  forme_domicile_faible:   'Dom. faible',
  forme_exterieur_forte:   'Ext. fort',
  forme_exterieur_faible:  'Ext. faible',
  equipe_motivee:          'Motivée',
  equipe_sans_enjeu:       'Sans enjeu',
  blessures_adversaire:    'Blessures',
  fatigue_calendrier:      'Fatigue',
  style_defensif:          'Défensif',
  over_equipes_offensives: 'Offensif',
  under_conditions_meteo:  'Météo',
  cote_value:              'Cote value',
  stat_domination:         'Stats dom.',
  instinct:                'Instinct',
}

function MiniCourbe({ historique }) {
  if (historique.length < 2) return null
  const valeurs = historique.map(h => h.bankroll)
  const min = Math.min(...valeurs)
  const max = Math.max(...valeurs)
  const amplitude = max - min || 1
  const HAUTEUR = 36
  const pts = historique.slice(-24)

  return (
    <View style={{ height: HAUTEUR, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      {pts.map((point, idx) => {
        const pct = (point.bankroll - min) / amplitude
        const hauteur = Math.max(pct * HAUTEUR, 3)
        const couleur = point.bankroll >= 0 ? '#4ade80' : '#f87171'
        return (
          <View
            key={idx}
            style={{
              flex: 1,
              height: hauteur,
              backgroundColor: couleur,
              borderRadius: 2,
              opacity: 0.75,
            }}
          />
        )
      })}
    </View>
  )
}

const CarteStatsPartage = forwardRef(function CarteStatsPartage({
  roiGlobal,
  tauxGlobal,
  profitTotal,
  nbGagnes,
  nbTotaux,
  coteMoyenne,
  meileurSport,
  roiMeileurSport,
  topTags,
  historiqueBankroll,
}, ref) {
  const roiCouleur    = roiGlobal >= 0    ? '#4ade80' : '#f87171'
  const profitCouleur = profitTotal >= 0  ? '#4ade80' : '#f87171'
  const winCouleur    = tauxGlobal >= 50  ? '#4ade80' : '#f87171'
  const date = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <View ref={ref} collapsable={false} style={{ width: 360 }}>
      <LinearGradient
        colors={['#0c0f1e', '#1a1040', '#0c0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 24, overflow: 'hidden' }}
      >
        {/* Accent lumineux haut gauche */}
        <View style={{
          position: 'absolute', top: -60, left: -60,
          width: 180, height: 180, borderRadius: 90,
          backgroundColor: '#3b82f6', opacity: 0.07,
        }} />
        <View style={{
          position: 'absolute', bottom: -40, right: -40,
          width: 140, height: 140, borderRadius: 70,
          backgroundColor: '#8b5cf6', opacity: 0.06,
        }} />

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 34, height: 34, borderRadius: 9,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>🎯</Text>
            </LinearGradient>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#f1f5f9', letterSpacing: 0.3 }}>BetEdge</Text>
              <Text style={{ fontSize: 9, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase' }}>Mes statistiques</Text>
            </View>
          </View>
          <View style={{
            backgroundColor: '#ffffff0a',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: '#ffffff10',
          }}>
            <Text style={{ fontSize: 10, color: '#64748b' }}>{date}</Text>
          </View>
        </View>

        {/* ROI Hero */}
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 10, color: '#475569', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            ROI Global
          </Text>
          <Text style={{ fontSize: 64, fontWeight: '800', color: roiCouleur, lineHeight: 68, letterSpacing: -1 }}>
            {roiGlobal >= 0 ? '+' : ''}{roiGlobal.toFixed(1)}%
          </Text>
        </View>

        {/* Séparateur dégradé */}
        <LinearGradient
          colors={['transparent', '#ffffff18', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1, marginVertical: 18 }}
        />

        {/* KPIs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <View style={{
            flex: 1,
            backgroundColor: '#ffffff07',
            borderRadius: 14,
            padding: 13,
            borderWidth: 1,
            borderColor: '#ffffff0d',
          }}>
            <Text style={{ fontSize: 9, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>WIN RATE</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: winCouleur }}>
              {tauxGlobal.toFixed(0)}%
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: '#ffffff07',
            borderRadius: 14,
            padding: 13,
            borderWidth: 1,
            borderColor: '#ffffff0d',
          }}>
            <Text style={{ fontSize: 9, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>PROFIT</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: profitCouleur }}>
              {profitTotal >= 0 ? '+' : ''}{profitTotal.toFixed(0)}€
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: '#ffffff07',
            borderRadius: 14,
            padding: 13,
            borderWidth: 1,
            borderColor: '#ffffff0d',
          }}>
            <Text style={{ fontSize: 9, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>PARIS</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#f1f5f9' }}>
              {nbGagnes}W/{nbTotaux - nbGagnes}L
            </Text>
          </View>
        </View>

        {/* Meilleur sport */}
        {meileurSport && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#4ade8010',
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: '#4ade8020',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 10, color: '#4ade80' }}>🏆</Text>
              <Text style={{ fontSize: 11, color: '#86efac' }}>Meilleur sport</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 12, color: '#f1f5f9', fontWeight: '600' }}>
                {LABEL_SPORT[meileurSport] ?? meileurSport}
              </Text>
              <View style={{
                backgroundColor: '#4ade8020',
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#4ade80' }}>
                  {roiMeileurSport >= 0 ? '+' : ''}{roiMeileurSport.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Top tags */}
        {topTags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {topTags.slice(0, 4).map(({ tag }) => (
              <View
                key={tag}
                style={{
                  backgroundColor: '#3b82f615',
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: '#3b82f630',
                }}
              >
                <Text style={{ fontSize: 10, color: '#93c5fd', fontWeight: '500' }}>
                  #{LABEL_TAG[tag] ?? tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Mini courbe bankroll */}
        {historiqueBankroll.length >= 3 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 9, color: '#334155', marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Évolution du profit
            </Text>
            <MiniCourbe historique={historiqueBankroll} />
          </View>
        )}

        {/* Footer */}
        <LinearGradient
          colors={['transparent', '#ffffff10', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1, marginBottom: 14 }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#334155' }}>Cote moy. {coteMoyenne.toFixed(2)}</Text>
          <Text style={{ fontSize: 10, color: '#334155' }}>Propulsé par BetEdge 🎯</Text>
        </View>
      </LinearGradient>
    </View>
  )
})

export default CarteStatsPartage

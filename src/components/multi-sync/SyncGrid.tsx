import { useState } from 'react'
import { useSyncStore, type VideoPlayerRef } from '../../stores/syncStore'
import { VideoPlayer } from '../player/VideoPlayer'
import { SyncControls } from './SyncControls'
import { LayoutEditor } from './LayoutEditor'

interface LayoutCell {
  playerId: string
  x: number
  y: number
  width: number
  height: number
}

interface SyncGridProps {
  playerIds: string[]
  groupId: string
  onClosePlayer: (playerId: string) => void
  onRegisterRef?: (id: string, ref: VideoPlayerRef | null) => void
}

export function SyncGrid({ playerIds, groupId, onClosePlayer, onRegisterRef }: SyncGridProps) {
  const [customLayout, setCustomLayout] = useState<LayoutCell[] | null>(null)
  const [showLayoutEditor, setShowLayoutEditor] = useState(false)

  // Init sync group
  useSyncStore.getState().createSyncGroup(groupId)

  const gridCols = playerIds.length <= 2 ? playerIds.length : Math.ceil(Math.sqrt(playerIds.length))
  const gridRows = Math.ceil(playerIds.length / gridCols)

  const renderVideo = (pid: string, style?: React.CSSProperties) => (
    <VideoPlayer
      key={pid}
      playerId={pid}
      syncGroupId={groupId}
      onClose={onClosePlayer}
      onRegisterRef={onRegisterRef}
      style={{ background: '#000', ...style }}
    />
  )

  return (
    <>
      <div data-sync-grid style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <SyncControls
          groupId={groupId}
          playerCount={playerIds.length}
          hasCustomLayout={!!customLayout}
          onOpenLayoutEditor={() => setShowLayoutEditor(true)}
        />

        <div style={{ flex: 1, position: 'relative', background: 'var(--border-subtle)', overflow: 'hidden' }}>
          {customLayout ? (
            customLayout.map(cell => (
              <div key={cell.playerId} style={{
                position: 'absolute',
                left: `${cell.x * 100}%`, top: `${cell.y * 100}%`,
                width: `${cell.width * 100}%`, height: `${cell.height * 100}%`,
                overflow: 'hidden', border: '1px solid var(--border)'
              }}>
                {renderVideo(cell.playerId, { width: '100%', height: '100%' })}
              </div>
            ))
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'grid',
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gridTemplateRows: `repeat(${gridRows}, 1fr)`,
              gap: 2
            }}>
              {playerIds.map(id => renderVideo(id))}
            </div>
          )}
        </div>
      </div>

      {showLayoutEditor && (
        <LayoutEditor
          playerIds={playerIds}
          syncGroupId={groupId}
          onClose={() => setShowLayoutEditor(false)}
          onApply={cells => { setCustomLayout(cells); setShowLayoutEditor(false) }}
        />
      )}
    </>
  )
}

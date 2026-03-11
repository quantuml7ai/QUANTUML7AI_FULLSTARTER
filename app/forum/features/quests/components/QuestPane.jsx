'use client'

import React from 'react'
import QuestHub from './QuestHub'

export default function QuestPane({
  t,
  quests,
  questProg,
  isCardCompleted,
  isCardClaimable,
  readEnv,
  vipActive,
  getTaskRemainMs,
  taskDelayMs,
  openQuestCardChecked,
  setQuestSel,
  markTaskDone,
  questSel,
}) {
  return (
    <>
      <div className="meta mt-1">{t('')}</div>
      <div data-forum-quest-start="1" />
      <QuestHub
        t={t}
        quests={quests}
        questProg={questProg}
        isCardCompleted={isCardCompleted}
        isCardClaimable={isCardClaimable}
        readEnv={readEnv}
        vipActive={vipActive}
        getTaskRemainMs={getTaskRemainMs}
        taskDelayMs={taskDelayMs}
        onOpenCard={openQuestCardChecked}
        onCloseCard={() => setQuestSel(null)}
        onMarkDone={(qid, tid) => markTaskDone(qid, tid)}
        selected={questSel}
      />
    </>
  )
}


'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import {
  SkillsProfile,
  SKILL_DIMENSIONS,
  SKILL_LEVEL_VALUES,
  LearnerRole,
  LEARNER_ROLES,
} from '@/lib/types';

interface ShareableSkillsCardProps {
  skills: SkillsProfile;
  completedModules: number;
  totalModules: number;
  streakDays: number;
  totalMinutesLearned: number;
  role: LearnerRole | null;
}

const LIGHT = {
  bg: 'oklch(0.99 0.003 80)',
  cardBg: 'oklch(1 0 0)',
  fg: 'oklch(0.16 0.005 50)',
  muted: 'oklch(0.50 0.01 50)',
  border: 'oklch(0.93 0.006 80)',
  primary: 'oklch(0.56 0.11 50)',
  primaryLight: 'oklch(0.56 0.11 50 / 0.22)',
  statBg: 'oklch(0.96 0.006 80)',
};

const DARK = {
  bg: 'oklch(0.14 0.005 60)',
  cardBg: 'oklch(0.18 0.006 60)',
  fg: 'oklch(0.93 0.005 60)',
  muted: 'oklch(0.60 0.01 60)',
  border: 'oklch(0.27 0.008 60)',
  primary: 'oklch(0.65 0.12 50)',
  primaryLight: 'oklch(0.65 0.12 50 / 0.22)',
  statBg: 'oklch(0.22 0.008 60)',
};

function MiniRadar({ skills, colors }: { skills: SkillsProfile; colors: typeof LIGHT }) {
  const cx = 100;
  const cy = 100;
  const maxR = 75;
  const dims = SKILL_DIMENSIONS;

  const gridRings = [1, 2, 3].map((level) => {
    const pts = dims.map((_, i) => {
      const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
      const r = (level / 3) * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });
    return pts.join(' ');
  });

  const points = dims.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    const value = SKILL_LEVEL_VALUES[skills[dim.id]];
    const r = (value / 3) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const labelOffset = maxR + 22;
  const labels = dims.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    const lx = cx + labelOffset * Math.cos(angle);
    const ly = cy + labelOffset * Math.sin(angle);
    let anchor: 'start' | 'middle' | 'end' = 'middle';
    if (Math.cos(angle) > 0.3) anchor = 'start';
    else if (Math.cos(angle) < -0.3) anchor = 'end';
    return { x: lx, y: ly, label: dim.shortLabel, anchor };
  });

  return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      {gridRings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={colors.border}
          strokeWidth={1}
        />
      ))}
      {dims.map((_, i) => {
        const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + maxR * Math.cos(angle)}
            y2={cy + maxR * Math.sin(angle)}
            stroke={colors.border}
            strokeWidth={0.5}
          />
        );
      })}
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={colors.primaryLight}
        stroke={colors.primary}
        strokeWidth={2}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.primary} />
      ))}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          dominantBaseline="central"
          fontSize="9"
          fill={colors.muted}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

export const ShareableSkillsCard = React.forwardRef<HTMLDivElement, ShareableSkillsCardProps>(
  function ShareableSkillsCard(
    { skills, completedModules, totalModules, streakDays, totalMinutesLearned, role },
    ref,
  ) {
    const { resolvedTheme } = useTheme();
    const colors = resolvedTheme === 'dark' ? DARK : LIGHT;
    const roleLabel = role ? LEARNER_ROLES.find((r) => r.id === role)?.label : null;
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          padding: 28,
          backgroundColor: colors.cardBg,
          color: colors.fg,
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill={colors.primary}
              />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Claude Learn</span>
          </div>
          <span style={{ fontSize: 11, color: colors.muted }}>{today}</span>
        </div>

        {/* Role badge */}
        {roleLabel && (
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontSize: 11,
                color: colors.primary,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {roleLabel} Path
            </span>
          </div>
        )}

        {/* Radar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <MiniRadar skills={skills} colors={colors} />
        </div>

        {/* Skill levels */}
        <div style={{ marginBottom: 20 }}>
          {SKILL_DIMENSIONS.map((dim) => (
            <div
              key={dim.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 0',
                fontSize: 13,
              }}
            >
              <span style={{ color: colors.muted }}>{dim.label}</span>
              <span
                style={{
                  fontWeight: 500,
                  color: skills[dim.id] === 'foundations' ? colors.muted : colors.primary,
                  textTransform: 'capitalize',
                }}
              >
                {skills[dim.id]}
              </span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: completedModules, label: `/ ${totalModules} modules` },
            { value: streakDays, label: 'day streak' },
            { value: totalMinutesLearned, label: 'minutes' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '10px 4px',
                borderRadius: 10,
                backgroundColor: colors.statBg,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600 }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: colors.muted }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

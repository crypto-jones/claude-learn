'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { SkillsProfile, SKILL_DIMENSIONS, SKILL_LEVEL_VALUES } from '@/lib/types';

interface SkillsRadarProps {
  skills: SkillsProfile;
}

export function SkillsRadar({ skills }: SkillsRadarProps) {
  const data = SKILL_DIMENSIONS.map((dim) => ({
    skill: dim.shortLabel,
    value: SKILL_LEVEL_VALUES[skills[dim.id]],
    fullMark: 3,
  }));

  return (
    <div className="w-full h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="90%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

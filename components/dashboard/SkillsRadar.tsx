'use client';

import { useRef, useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { SkillsProfile, SKILL_DIMENSIONS, SKILL_LEVEL_VALUES } from '@/lib/types';

interface SkillsRadarProps {
  skills: SkillsProfile;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function createCustomTick(targetDist: number, fontSize: number, color: string) {
  return function CustomTick(props: any) {
    const { x, y, cx, cy, payload } = props;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scale = dist > 0 ? targetDist / dist : 1;
    const labelX = cx + dx * scale;
    const labelY = cy + dy * scale;

    let anchor: 'start' | 'middle' | 'end' = 'middle';
    if (dx > 10) anchor = 'start';
    else if (dx < -10) anchor = 'end';

    return (
      <text
        x={labelX}
        y={labelY}
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={fontSize}
        fill={color}
      >
        {payload.value}
      </text>
    );
  };
}

export function SkillsRadar({ skills }: SkillsRadarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ targetDist: 130, fontSize: 13, outerRadius: '100%' });
  const [colors, setColors] = useState({
    primary: '#b87a4a',
    border: '#e5e5e5',
    mutedForeground: '#737373',
  });

  useEffect(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const primary = style.getPropertyValue('--color-primary').trim();
    const border = style.getPropertyValue('--color-border').trim();
    const mutedFg = style.getPropertyValue('--color-muted-foreground').trim();
    if (primary) setColors({ primary, border, mutedForeground: mutedFg });
  }, []);

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width < 400) {
        setDimensions({ targetDist: 95, fontSize: 11, outerRadius: '60%' });
      } else {
        setDimensions({ targetDist: 130, fontSize: 13, outerRadius: '80%' });
      }
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const data = SKILL_DIMENSIONS.map((dim) => ({
    skill: dim.shortLabel,
    value: SKILL_LEVEL_VALUES[skills[dim.id]],
    fullMark: 3,
  }));

  const TickComponent = createCustomTick(dimensions.targetDist, dimensions.fontSize, colors.mutedForeground);

  return (
    <div ref={containerRef} className="w-full h-[280px] [&_svg]:!overflow-visible">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={dimensions.outerRadius}>
          <PolarGrid stroke={colors.border} />
          <PolarAngleAxis dataKey="skill" tick={TickComponent} />
          <PolarRadiusAxis
            domain={[0, 3]}
            tickCount={4}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke={colors.primary}
            fill={colors.primary}
            fillOpacity={0.22}
            strokeWidth={2}
            dot={{ r: 4, fill: colors.primary, strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { SkillsProfile, SkillDimension, SKILL_DIMENSIONS, SKILL_LEVEL_VALUES } from '@/lib/types';

interface SkillsRadarProps {
  skills: SkillsProfile;
  initialSkills?: SkillsProfile | null;
  dimensions?: SkillDimension[];
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

export function SkillsRadar({ skills, initialSkills, dimensions: dimensionFilter }: SkillsRadarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [sizing, setSizing] = useState({ targetDist: 130, fontSize: 13, outerRadius: '100%' });
  const [colors, setColors] = useState({
    primary: '#b87a4a',
    border: '#e5e5e5',
    mutedForeground: '#737373',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const primary = style.getPropertyValue('--color-primary').trim();
      const border = style.getPropertyValue('--color-border').trim();
      const mutedFg = style.getPropertyValue('--color-muted-foreground').trim();
      if (primary) setColors({ primary, border, mutedForeground: mutedFg });
    }, 50);
    return () => clearTimeout(timer);
  }, [resolvedTheme]);

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width < 400) {
        setSizing({ targetDist: 95, fontSize: 11, outerRadius: '60%' });
      } else {
        setSizing({ targetDist: 130, fontSize: 13, outerRadius: '80%' });
      }
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const dims = dimensionFilter
    ? SKILL_DIMENSIONS.filter((d) => dimensionFilter.includes(d.id))
    : SKILL_DIMENSIONS;

  const data = dims.map((dim) => ({
    skill: dim.shortLabel,
    value: SKILL_LEVEL_VALUES[skills[dim.id]],
    initial: initialSkills ? SKILL_LEVEL_VALUES[initialSkills[dim.id]] : undefined,
    fullMark: 3,
  }));

  const hasGrowth = initialSkills && dims.some(
    (dim) => SKILL_LEVEL_VALUES[skills[dim.id]] > SKILL_LEVEL_VALUES[initialSkills[dim.id]]
  );

  const TickComponent = createCustomTick(sizing.targetDist, sizing.fontSize, colors.mutedForeground);

  return (
    <div ref={containerRef} className="w-full h-[280px] [&_svg]:!overflow-visible">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={sizing.outerRadius}>
          <PolarGrid stroke={colors.border} />
          <PolarAngleAxis dataKey="skill" tick={TickComponent} />
          <PolarRadiusAxis
            domain={[0, 3]}
            tickCount={4}
            tick={false}
            axisLine={false}
          />
          {hasGrowth && (
            <Radar
              name="Initial"
              dataKey="initial"
              stroke={colors.mutedForeground}
              fill={colors.mutedForeground}
              fillOpacity={0.08}
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
          <Radar
            name="Skills"
            dataKey="value"
            stroke={colors.primary}
            fill={colors.primary}
            fillOpacity={0.22}
            strokeWidth={2}
            dot={{ r: 4, fill: colors.primary, strokeWidth: 0 }}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

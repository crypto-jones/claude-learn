'use client';

import { useRef, useState, useEffect } from 'react';
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function createCustomTick(targetDist: number, fontSize: number) {
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
        fill="hsl(var(--muted-foreground))"
      >
        {payload.value}
      </text>
    );
  };
}

export function SkillsRadar({ skills }: SkillsRadarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ targetDist: 115, fontSize: 13, outerRadius: '225%' });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width < 400) {
        // Mobile: smaller grid, labels tighter, smaller font
        setDimensions({ targetDist: 85, fontSize: 11, outerRadius: '160%' });
      } else {
        // Desktop: labels further out, larger font
        setDimensions({ targetDist: 115, fontSize: 13, outerRadius: '225%' });
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

  const TickComponent = createCustomTick(dimensions.targetDist, dimensions.fontSize);

  return (
    <div ref={containerRef} className="w-full h-[280px] [&_svg]:!overflow-visible">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={dimensions.outerRadius}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="skill" tick={TickComponent} />
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

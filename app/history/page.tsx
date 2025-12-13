'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { UnpackEntry } from '@/lib/types';
import { getRecentEntries, getAllWords, getAssociations } from '@/lib/storage';
import StepShell from '@/components/StepShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<UnpackEntry[]>([]);
  const [wordCounts, setWordCounts] = useState<{ word: string; count: number }[]>([]);
  const [associations, setAssociations] = useState<{ timeOfDay?: string; weekdayPattern?: string }>({});

  useEffect(() => {
    const recent = getRecentEntries(7);
    setEntries(recent);

    const words = getAllWords();
    const wordMap: Record<string, number> = {};
    getRecentEntries(30).forEach(entry => {
      entry.words.forEach(word => {
        wordMap[word] = (wordMap[word] || 0) + 1;
      });
    });
    setWordCounts(
      Object.entries(wordMap)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    );

    setAssociations(getAssociations());
  }, []);

  const chartData = entries.map((entry, index) => ({
    name: `Entry ${index + 1}`,
    intensity: entry.intensity,
    date: new Date(entry.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
      <StepShell 
        title="Your History"
      >
      <div className="w-full space-y-6">
        {/* Intensity over time */}
        <Card>
          <h2 className="text-xl font-light text-gray-800 mb-6">Intensity over time</h2>
          {entries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(0,0,0,0.3)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="rgba(0,0,0,0.3)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    color: '#000',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="#84cc16"
                  strokeWidth={2}
                  dot={{ fill: '#84cc16', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No entries yet</p>
          )}
        </Card>

        {/* Top words */}
        <Card>
          <h2 className="text-xl font-light text-gray-800 mb-6">Words you&apos;ve used</h2>
          {wordCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={wordCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="word"
                  stroke="rgba(0,0,0,0.3)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="rgba(0,0,0,0.3)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    color: '#000',
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No words selected yet</p>
          )}
        </Card>

        {/* Associations */}
        {(associations.timeOfDay || associations.weekdayPattern) && (
          <Card>
            <h2 className="text-xl font-light text-gray-800 mb-6">Associations</h2>
            <div className="space-y-4 text-gray-600">
              {associations.timeOfDay && (
                <p>Most check-ins happen in the <span className="text-gray-800 font-medium">{associations.timeOfDay}</span>.</p>
              )}
              {associations.weekdayPattern && (
                <p>Intensity tends to be higher on <span className="text-gray-800 font-medium">{associations.weekdayPattern}</span>.</p>
              )}
            </div>
          </Card>
        )}

        {/* Back button */}
        <div className="flex justify-center pt-4">
          <Button onClick={() => router.push('/')}>
            New check-in
          </Button>
        </div>
      </div>
    </StepShell>
  );
}


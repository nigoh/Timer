import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Timer, List } from 'lucide-react';
import { BasicTimer } from './components/BasicTimer';
import { AgendaTimer } from './components/AgendaTimer';
import './globals.css';

function App() {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">Timer App</h1>
          <p className="text-muted-foreground">
            業務効率化を目的とした多機能タイマーアプリケーション
          </p>
        </header>
        
        <main>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                基本タイマー
              </TabsTrigger>
              <TabsTrigger value="agenda" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                アジェンダタイマー
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <BasicTimer />
            </TabsContent>

            <TabsContent value="agenda">
              <AgendaTimer />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

export default App;

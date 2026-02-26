import { createContext, useContext } from 'react';

const TaskIdContext = createContext<string>('');

export const TaskIdProvider = TaskIdContext.Provider;

export const useTaskId = () => useContext(TaskIdContext);

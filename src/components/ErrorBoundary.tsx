import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { logger } from '../utils/logger';
import LogViewer from './LogViewer';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Unknown';
    
    // ログにエラーを記録
    logger.error(`Error boundary caught error in ${componentName}`, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: componentName,
      props: this.props,
      timestamp: new Date().toISOString()
    }, 'error');

    this.setState({
      error,
      errorInfo,
    });

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    logger.userAction('Error boundary reload clicked', {
      component: this.props.componentName || 'Unknown',
      error: this.state.error?.message
    });
    
    window.location.reload();
  };

  private handleReset = () => {
    logger.userAction('Error boundary reset clicked', {
      component: this.props.componentName || 'Unknown',
      error: this.state.error?.message
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-red-600">
                エラーが発生しました
              </CardTitle>
              <CardDescription>
                {this.props.componentName ? 
                  `${this.props.componentName}で予期しないエラーが発生しました。` :
                  '予期しないエラーが発生しました。'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* エラーメッセージ */}
              {this.state.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">
                    エラー詳細:
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* 開発環境でのスタックトレース */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 mb-2">
                    スタックトレースを表示
                  </summary>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  再試行
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  ページを再読み込み
                </Button>

                <LogViewer>
                  <Button variant="outline" size="sm">
                    <Bug className="w-4 h-4 mr-2" />
                    ログを確認
                  </Button>
                </LogViewer>
              </div>

              {/* ユーザー向けヘルプメッセージ */}
              <div className="text-sm text-gray-600 text-center pt-2">
                <p>
                  問題が解決しない場合は、ブラウザを再起動するか、
                  開発者にログ情報をお知らせください。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

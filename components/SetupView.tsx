
import React, { useState } from 'react';
import { AppConfig, ModelProvider } from '../types';
import { testConnection } from '../aiService';

interface SetupViewProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onFinish: () => void;
}

const SetupView: React.FC<SetupViewProps> = ({ config, setConfig, onFinish }) => {
  const [step, setStep] = useState(1);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string }>({});

  const handleSelectProvider = (provider: ModelProvider) => {
    const defaultModel = provider === 'gemini' ? 'gemini-2.5-flash' : 'kimi-k2.5';
    setConfig(prev => ({ ...prev, provider, modelName: defaultModel, apiKeyTested: false }));
    setTestResult({});
    setStep(2);
  };

  const runTest = async () => {
    if (!config.apiKey) {
      setTestResult({ success: false, message: "请输入 API Key。" });
      return;
    }
    setIsTesting(true);
    setTestResult({});
    const result = await testConnection(config);
    setTestResult(result);
    if (result.success) {
      setConfig(prev => ({ ...prev, apiKeyTested: true }));
    } else {
      setConfig(prev => ({ ...prev, apiKeyTested: false }));
    }
    setIsTesting(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      <div className="bg-surface-dark rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none select-none">
          <span className="material-icons text-9xl">settings_suggest</span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
              <span className="material-icons text-2xl">
                {step === 1 ? 'auto_awesome' : 'security'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">AI 助手配置</h2>
              <p className="text-slate-500 text-sm">简单两步，开启您的智能生产力助手</p>
            </div>
          </div>

          <div className="flex gap-3 mb-12">
            <div className="flex-1 space-y-2">
              <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= 1 ? 'bg-primary shadow-[0_0_10px_rgba(19,127,238,0.5)]' : 'bg-slate-800'}`}></div>
              <p className={`text-[10px] font-bold uppercase tracking-widest text-center ${step === 1 ? 'text-primary' : 'text-slate-600'}`}>1. 选择引擎</p>
            </div>
            <div className="flex-1 space-y-2">
              <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= 2 ? 'bg-primary shadow-[0_0_10px_rgba(19,127,238,0.5)]' : 'bg-slate-800'}`}></div>
              <p className={`text-[10px] font-bold uppercase tracking-widest text-center ${step === 2 ? 'text-primary' : 'text-slate-600'}`}>2. 认证连接</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-end">
                <h3 className="text-lg font-bold text-white">请选择模型服务商</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleSelectProvider('gemini')}
                  className="group relative p-6 rounded-3xl border-2 border-slate-800 bg-slate-900/40 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform">
                    <span className="material-icons text-2xl">bolt</span>
                  </div>
                  <h4 className="font-bold text-lg text-white mb-2">Google Gemini</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    极速响应，支持免费额度。适合处理快速记录和高频交互任务。
                  </p>
                </button>

                <button
                  onClick={() => handleSelectProvider('kimi')}
                  className="group relative p-6 rounded-3xl border-2 border-slate-800 bg-slate-900/40 text-left transition-all hover:border-success hover:bg-success/5 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success mb-5 group-hover:scale-110 transition-transform">
                    <span className="material-icons text-2xl">psychology</span>
                  </div>
                  <h4 className="font-bold text-lg text-white mb-2">Kimi (Moonshot)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    深度理解中文语境。为您提供精准的分析与流畅的交互体验。
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">验证 API 密钥</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">引擎：<span className="text-primary font-bold uppercase">{config.provider}</span></p>
                    <span className="text-slate-700">|</span>
                    <input
                      type="text"
                      value={config.modelName}
                      onChange={(e) => setConfig(prev => ({ ...prev, modelName: e.target.value }))}
                      className="bg-transparent border-b border-slate-700 text-[10px] text-primary font-bold focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
                >
                  <span className="material-icons text-xs">edit</span> 修改引擎
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    placeholder={`输入您的 ${config.provider === 'gemini' ? 'Gemini' : 'Kimi'} API Key`}
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value, apiKeyTested: false }))}
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 px-6 text-white text-sm focus:border-primary focus:outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <a
                      href={config.provider === 'gemini' ? "https://aistudio.google.com/app/apikey" : "https://platform.moonshot.cn/console/api-keys"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 bg-slate-900 pl-2"
                    >
                      获取 Key <span className="material-icons text-[10px]">open_in_new</span>
                    </a>
                  </div>
                </div>

                <div className={`p-6 rounded-[1.5rem] border transition-all duration-500 ${isTesting ? 'bg-slate-900 border-slate-800 animate-pulse' :
                  testResult.success ? 'bg-success/5 border-success/30' :
                    testResult.message ? 'bg-danger/5 border-danger/30' :
                      'bg-slate-900/50 border-slate-800'
                  }`}>
                  {isTesting ? (
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-400">正在验证联通性...</p>
                    </div>
                  ) : testResult.success ? (
                    <div className="flex items-center gap-3 text-success">
                      <span className="material-icons text-xl">check_circle</span>
                      <p className="text-xs font-bold">{testResult.message}</p>
                    </div>
                  ) : testResult.message ? (
                    <div className="flex items-center gap-3 text-danger">
                      <span className="material-icons text-xl">error</span>
                      <p className="text-xs font-bold">{testResult.message}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">请输入密钥并点击下方按钮进行验证。</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  {testResult.success ? (
                    <button
                      onClick={onFinish}
                      className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all text-lg"
                    >
                      开启工作台
                    </button>
                  ) : (
                    <button
                      onClick={runTest}
                      disabled={isTesting || !config.apiKey}
                      className="w-full py-4 rounded-2xl bg-white text-background-dark font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-icons text-[20px]">play_circle</span>
                      立即开始验证
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  密钥将直接用于与 AI 服务商进行安全连接，不存储于第三方服务器。<br />
                  确保隐私与极速体验。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupView;

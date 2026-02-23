import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import bgImage from '../assets/Images/Login2.jpg';
import { IconInput } from '@/components/ui/IconInput';
import { GlassCard } from '@/components/login/GlassCard';
import { BaseInput } from '@/components/ui/Baseinput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const data = await authService.login(email, password);
            if (data && data.access_token) {
                localStorage.setItem('token', data.access_token);
                console.log('Login successful:', data);
                navigate('/test-suite-manager');
            } else {
                setError('Login failed. No access token received.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please check your credentials.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Section width="w-full" className="min-h-screen" background={`url(${bgImage}) center/cover no-repeat`}>
            <GlassCard>
                <Section width="w-full" className="text-gray-900 flex justify-center items-center py-8 md:py-0">
                    <div className="w-full md:w-[85%] max-w-[400px]">
                        <form onSubmit={handleLogin} className="w-full">
                            <h2 className="text-[2em] text-center mb-5 font-bold text-gray-900">Login</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <IconInput label="Email" type="email" icon={Mail} required value={email} onChange={(e) => setEmail(e.target.value)} />
                            <IconInput label="Password" type="password" icon={Lock} required value={password} onChange={(e) => setPassword(e.target.value)} />

                            <div className="mx-auto w-full mt-[-15px] mb-[15px] text-[0.9em] flex justify-between">
                                <Label className="flex items-center gap-[3px] font-normal text-[1em] text-gray-700">
                                    <BaseInput type="checkbox" className="accent-gray-900 w-auto h-auto shadow-none border-0" />
                                    Remember me
                                </Label>
                                <Link to="/forgot-password" title="Forgot Password" className="text-gray-700 no-underline hover:underline hover:text-black">Forgot Password</Link>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="block mx-auto w-full h-[40px] bg-gray-900 border-none outline-none text-white text-[1em] cursor-pointer rounded-[40px] font-medium transition-all duration-500 ease-in-out hover:bg-gray-800 hover:scale-[1.02] hover:shadow-xl shadow-lg disabled:opacity-50"
                            >
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </div>
                </Section>
            </GlassCard>
        </Section>
    );
};
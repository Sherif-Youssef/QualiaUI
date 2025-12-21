import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import bgImage from '../assets/Images/Login2.jpg';
import { IconInput } from '@/components/ui/IconInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { BaseInput } from '@/components/ui/Baseinput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/test-suite-manager');// should be handled later 
    };

    return (
        <Section width="w-full" className="min-h-screen" background={`url(${bgImage}) center/cover no-repeat`}>
           <GlassCard>
            <Section width="w-full md:w-[35%]" className="flex-col !justify-center !items-start text-gray-800 pt-0 bg-transparent">
                <h2 className="text-[2.4em] font-bold mb-6 whitespace-nowrap bg-gradient-to-r from-[#FDBB2D] to-[#22C1C3] bg-clip-text text-transparent">Qualia UI</h2>
                <p className="text-lg text-left px-6 pl-0 font-medium leading-relaxed opacity-90">
                    You are one step away from gaining full insight into your site’s performance.
                </p>
            </Section>
            <Section width="w-full md:w-[65%]" className="text-gray-900 flex justify-center items-center py-8 md:py-0">
                <div className="w-full md:w-[85%] max-w-[400px] bg-white/40 rounded-[20px] p-6 md:p-8 shadow-2xl backdrop-blur-md border border-white/40">
                    <form onSubmit={handleLogin} className="w-full">
                        <h2 className="text-[2em] text-center mb-5 font-bold text-gray-900">Login</h2>
                        <IconInput label="Email" type="email" icon={Mail} required value={email} onChange={(e) => setEmail(e.target.value)} />
                        <IconInput label="Password" type="password" icon={Lock} required value={password} onChange={(e) => setPassword(e.target.value)}/>
                        <div className="mx-auto w-full mt-[-15px] mb-[15px] text-[0.9em] flex justify-between">
                            <Label className="flex items-center gap-[3px] font-normal text-[1em] text-gray-700">
                                <BaseInput type="checkbox" className="accent-gray-900 w-auto h-auto shadow-none border-0" />
                                Remember me
                            </Label>
                            <a href="#" className="text-gray-700 no-underline hover:underline hover:text-black">Forgot Password</a>
                        </div>
                        <Button type="submit" className="block mx-auto w-full h-[40px] bg-gray-900 border-none outline-none text-white text-[1em] cursor-pointer rounded-[40px] font-medium transition-all duration-500 ease-in-out hover:bg-gray-800 hover:scale-[1.02] hover:shadow-xl shadow-lg">
                            Login
                        </Button>
                        <div className="text-[0.9em] text-center mt-[25px] mb-[10px] text-gray-700">
                            <p>Don't have an account? <span onClick={() => navigate('/signup')} className="cursor-pointer font-bold text-gray-900 hover:underline">Register</span></p>
                        </div>
                    </form>
                </div>
            </Section>
           </GlassCard>
        </Section>
    );
};
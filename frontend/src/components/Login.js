import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { login } = useAuth();
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Welcome to LinkedIn-Style App</h1>
      <p>Sign in to continue</p>
      <button onClick={login}>Sign in with Google</button>
    </div>
  );
};

export default Login;
window.auth = (function () {

    // SIGN UP
    async function signUp(data) {
        var result = await window.sb.auth.signUp({
            email:    data.email,
            password: data.password,
            options: {
                data: {
                    full_name:  data.full_name,
                    phone:      data.phone,
                    age:        data.age,
                    height_cm:  data.height_cm,
                    weight_kg:  data.weight_kg,
                    goal:       data.goal
                }
            }
        });
        return result;
    }

    // SIGN IN
    async function signIn(email, password) {
        return await window.sb.auth.signInWithPassword({ email, password });
    }

    // SIGN OUT
    async function signOut() {
        await window.sb.auth.signOut();
        location.replace('/index.html');
    }

    // Get current session
    async function getSession() {
        var { data } = await window.sb.auth.getSession();
        return data.session;
    }

    // Get role
    async function getRole() {
        var cached = sessionStorage.getItem('jw_role');
        if (cached) return cached;

        var session = await getSession();
        if (!session) return null;

        var { data, error } = await window.sb
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error || !data) return null;
        sessionStorage.setItem('jw_role', data.role);
        return data.role;
    }

    // Require auth
    async function requireAuth(allowedRole) {
        var session = await getSession();
        if (!session) {
            location.replace('/auth/login.html');
            return;
        }
        if (allowedRole) {
            var role = await getRole();
            if (role !== allowedRole) {
                location.replace(role === 'admin' ? '/dashboard/admin.html' : '/dashboard/client.html');
            }
        }
    }

    // Password reset email
    async function sendResetEmail(email) {
        return await window.sb.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://www.jojowellnesscoach.com/auth/reset-password.html'
        });
    }

    // Update password
    async function updatePassword(newPassword) {
        return await window.sb.auth.updateUser({ password: newPassword });
    }

    // Auth state changes
    function onAuthChange(callback) {
        var { data } = window.sb.auth.onAuthStateChange(function (event, session) {
            callback(event, session);
        });
        return data.subscription.unsubscribe;
    }

    // Toast notification
    function toast(message, type) {
        var existing = document.getElementById('jw-toast');
        if (existing) existing.remove();

        var el = document.createElement('div');
        el.id = 'jw-toast';
        el.className = 'jw-toast jw-toast--' + (type || 'error');
        el.textContent = message;
        document.body.appendChild(el);

        setTimeout(function () { el.classList.add('jw-toast--visible'); }, 10);
        setTimeout(function () {
            el.classList.remove('jw-toast--visible');
            setTimeout(function () { el.remove(); }, 400);
        }, 4000);
    }

    return { signUp, signIn, signOut, getSession, getRole, requireAuth, sendResetEmail, updatePassword, onAuthChange, toast };
})();

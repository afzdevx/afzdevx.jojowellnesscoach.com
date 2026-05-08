(async function () {

    await window.auth.requireAuth('client');

    var session = await window.auth.getSession();
    var userId  = session.user.id;

    // LOGOUT
    document.getElementById('logoutBtn').addEventListener('click', window.auth.signOut);
    var mobileLogout = document.getElementById('mobileLogout');
    if (mobileLogout) mobileLogout.addEventListener('click', window.auth.signOut);

    // TABS
    document.querySelectorAll('.dash-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.dash-tab').forEach(function (b) {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.dash-panel').forEach(function (p) {
                p.classList.remove('active');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            document.getElementById('panel-' + this.dataset.tab).classList.add('active');
        });
    });

    // PROFILE
    async function loadProfile() {
        var { data } = await window.sb
            .from('profiles')
            .select('full_name, goal, created_at')
            .eq('id', userId)
            .single();

        if (!data) return;

        var initials = (data.full_name || '?').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
        document.getElementById('profileAvatar').textContent = initials;
        document.getElementById('profileName').textContent   = data.full_name || 'Client';

        var goalMap = { lose_weight: 'Lose Weight', gain_muscle: 'Gain Muscle', both: 'Lose Weight & Gain Muscle' };
        var since   = data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
        document.getElementById('profileMeta').innerHTML =
            '<span class="goal-badge">' + (goalMap[data.goal] || data.goal) + '</span>' +
            (since ? ' &nbsp;&bull;&nbsp; Member since ' + since : '');
    }

    // PROGRAMS
    async function loadPrograms() {
        var { data, error } = await window.sb
            .from('client_programs')
            .select('assigned_at, programs(id, title, description, type, file_url)')
            .eq('client_id', userId);

        var grid = document.getElementById('programsGrid');

        if (error || !data || data.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No programs assigned yet. Check back after Jojo sets up your plan!</p></div>';
            return;
        }

        grid.innerHTML = data.map(function (row) {
            var p = row.programs;
            var typeLabel = { pdf: 'PDF Guide', video: 'Video', link: 'Online Resource' }[p.type] || p.type;
            return '<div class="program-card">' +
                '<span class="program-type-badge">' + typeLabel + '</span>' +
                '<h3>' + escapeHtml(p.title) + '</h3>' +
                '<p>' + escapeHtml(p.description || '') + '</p>' +
                '<button class="btn btn-primary" onclick="downloadProgram(\'' + p.id + '\',\'' + p.type + '\',\'' + escapeHtml(p.file_url || '') + '\')">Download / View</button>' +
            '</div>';
        }).join('');
    }

    // DOWNLOAD
    window.downloadProgram = async function (programId, type, fileUrl) {
        if (type === 'link') {
            window.open(fileUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        var path = fileUrl.replace(/^.*\/storage\/v1\/object\/[^/]+\/programs\//, '');
        var { data, error } = await window.sb.storage.from('programs').createSignedUrl(path, 3600);

        if (error || !data) {
            window.auth.toast('Could not open file. Please try again.', 'error');
            return;
        }
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    };

    // PROGRESS
    async function loadProgress() {
        var { data } = await window.sb
            .from('progress_logs')
            .select('id, logged_at, weight_kg, notes')
            .eq('client_id', userId)
            .order('logged_at', { ascending: true });

        renderChart(data || []);
        renderLogsList(data || []);
    }

    function renderChart(logs) {
        var chart = document.getElementById('progressChart');
        var weightLogs = logs.filter(function (l) { return l.weight_kg; });

        if (weightLogs.length === 0) {
            chart.innerHTML = '<div class="empty-state"><p>No weight logs yet.</p></div>';
            return;
        }

        var weights = weightLogs.map(function (l) { return parseFloat(l.weight_kg); });
        var max = Math.max.apply(null, weights);
        var min = Math.min.apply(null, weights);
        var range = max - min || 1;

        chart.innerHTML = weightLogs.slice(-12).map(function (l) {
            var w   = parseFloat(l.weight_kg);
            var pct = ((w - min) / range) * 75 + 20;
            var dt  = new Date(l.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return '<div class="progress-bar-wrap">' +
                '<div class="progress-bar" style="height:' + Math.round(pct) + 'px;" title="' + w + ' kg"></div>' +
                '<div class="progress-bar-label">' + dt + '<br>' + w + 'kg</div>' +
            '</div>';
        }).join('');
    }

    function renderLogsList(logs) {
        var wrap = document.getElementById('logsList');
        if (logs.length === 0) { wrap.innerHTML = ''; return; }

        var recent = logs.slice().reverse().slice(0, 10);
        wrap.innerHTML = '<div class="dash-card"><h3>Recent Logs</h3>' +
            recent.map(function (l) {
                var dt = new Date(l.logged_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                return '<div style="padding:0.7rem 0; border-bottom:1px solid var(--border); font-size:0.875rem;">' +
                    '<strong>' + dt + '</strong>' +
                    (l.weight_kg ? ' &nbsp;&bull;&nbsp; ' + l.weight_kg + ' kg' : '') +
                    (l.notes ? '<p style="color:var(--text-muted); margin-top:0.2rem;">' + escapeHtml(l.notes) + '</p>' : '') +
                '</div>';
            }).join('') +
        '</div>';
    }

    // LOG FORM
    document.getElementById('logForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var btn    = document.getElementById('logBtn');
        var date   = document.getElementById('log_date').value;
        var weight = document.getElementById('log_weight').value;
        var notes  = document.getElementById('log_notes').value.trim();

        if (!date) { window.auth.toast('Please select a date.', 'error'); return; }

        btn.disabled = true;
        btn.textContent = 'Saving…';

        var { error } = await window.sb.from('progress_logs').insert({
            client_id: userId,
            logged_at: date,
            weight_kg: weight ? parseFloat(weight) : null,
            notes:     notes || null
        });

        btn.disabled = false;
        btn.textContent = 'Add Log';

        if (error) { window.auth.toast('Could not save log. Please try again.', 'error'); return; }

        window.auth.toast('Check-in logged!', 'success');
        this.reset();
        loadProgress();
    });

    document.getElementById('log_date').value = new Date().toISOString().split('T')[0];

    // UTIL
    function escapeHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // INIT
    loadProfile();
    loadPrograms();
    loadProgress();

})();

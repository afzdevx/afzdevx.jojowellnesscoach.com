(async function () {

    await window.auth.requireAuth('admin');

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

    // UTIL
    function escapeHtml(str) {
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(str || '').replace(/[&<>"']/g, function (c) { return map[c]; });
    }

    // CLIENTS
    var allClients = [];

    async function loadClients() {
        var { data, error } = await window.sb
            .from('profiles')
            .select('id, full_name, email, phone, age, height_cm, weight_kg, goal, created_at')
            .eq('role', 'client')
            .order('created_at', { ascending: false });

        var wrap = document.getElementById('clientsTableWrap');

        if (error || !data || data.length === 0) {
            wrap.innerHTML = '<div class="empty-state"><p>No clients yet.</p></div>';
            return;
        }

        allClients = data;
        renderClientsTable(data);

        var select = document.getElementById('assign_client');
        select.innerHTML = '<option value="">— No assignment yet —</option>' +
            data.map(function (c) {
                return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.full_name) + ' (' + escapeHtml(c.email) + ')</option>';
            }).join('');
    }

    function renderClientsTable(clients) {
        var wrap = document.getElementById('clientsTableWrap');
        var goalMap = { lose_weight: 'Lose Weight', gain_muscle: 'Gain Muscle', both: 'Both' };

        if (clients.length === 0) {
            wrap.innerHTML = '<div class="empty-state"><p>No matching clients.</p></div>';
            return;
        }

        wrap.innerHTML = '<table class="clients-table">' +
            '<thead><tr>' +
            '<th>Name</th><th>Email</th><th>Goal</th><th>Joined</th><th></th>' +
            '</tr></thead>' +
            '<tbody>' +
            clients.map(function (c) {
                var joined = c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                return '<tr class="client-row" data-id="' + escapeHtml(c.id) + '">' +
                    '<td>' + escapeHtml(c.full_name) + '</td>' +
                    '<td>' + escapeHtml(c.email) + '</td>' +
                    '<td><span class="goal-badge">' + (goalMap[c.goal] || escapeHtml(c.goal) || '—') + '</span></td>' +
                    '<td>' + joined + '</td>' +
                    '<td><button class="btn btn-outline" style="padding:0.4rem 1rem; font-size:0.65rem;" data-action="toggle-detail" data-client-id="' + escapeHtml(c.id) + '">Details</button></td>' +
                '</tr>' +
                '<tr class="client-detail-row" id="detail-' + escapeHtml(c.id) + '" style="display:none;">' +
                    '<td colspan="5"><div id="detail-body-' + escapeHtml(c.id) + '"><span class="spinner"></span></div></td>' +
                '</tr>';
            }).join('') +
            '</tbody></table>';
    }

    // TOGGLE DETAIL
    async function toggleClientDetail(clientId) {
        var row  = document.getElementById('detail-' + clientId);
        var body = document.getElementById('detail-body-' + clientId);

        if (row.style.display !== 'none') {
            row.style.display = 'none';
            return;
        }

        row.style.display = 'table-row';

        var [logsRes, progsRes, allProgsRes] = await Promise.all([
            window.sb.from('progress_logs').select('logged_at, weight_kg, notes').eq('client_id', clientId).order('logged_at', { ascending: false }).limit(5),
            window.sb.from('client_programs').select('programs(id, title, type)').eq('client_id', clientId),
            window.sb.from('programs').select('id, title')
        ]);

        var client   = allClients.find(function (c) { return c.id === clientId; }) || {};
        var logs     = logsRes.data  || [];
        var progs    = (progsRes.data || []).map(function (r) { return r.programs; });
        var allProgs = allProgsRes.data || [];
        var assignedIds = progs.map(function (p) { return p.id; });

        var logsHtml = logs.length === 0 ? '<em style="color:var(--text-muted)">No progress logs yet.</em>' :
            logs.map(function (l) {
                return '<div style="font-size:0.8rem; padding:0.35rem 0; border-bottom:1px solid var(--border);">' +
                    new Date(l.logged_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) +
                    (l.weight_kg ? ' — ' + l.weight_kg + ' kg' : '') +
                    (l.notes ? ' — ' + escapeHtml(l.notes) : '') +
                    '</div>';
            }).join('');

        var progsHtml = progs.length === 0 ? '<em style="color:var(--text-muted)">No programs assigned.</em>' :
            progs.map(function (p) { return escapeHtml(p.title); }).join(', ');

        var unassigned = allProgs.filter(function (p) { return !assignedIds.includes(p.id); });
        var assignSelect = unassigned.length === 0 ? '' :
            '<div style="margin-top:0.8rem; display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;">' +
            '<select id="assign-select-' + escapeHtml(clientId) + '" style="flex:1; min-width:180px; background:#111; border:1px solid var(--border); border-radius:8px; padding:0.55rem 0.8rem; color:var(--text); font-family:Inter,sans-serif; font-size:0.84rem;">' +
            '<option value="">— Assign a program —</option>' +
            unassigned.map(function (p) { return '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.title) + '</option>'; }).join('') +
            '</select>' +
            '<button class="btn btn-primary" style="padding:0.55rem 1.2rem; font-size:0.7rem;" data-action="assign-program" data-client-id="' + escapeHtml(clientId) + '">Assign</button>' +
            '</div>';

        body.innerHTML =
            '<div class="client-detail-grid">' +
            '<div class="detail-field"><span>Email</span>' + escapeHtml(client.email || '—') + '</div>' +
            '<div class="detail-field"><span>Phone</span>' + escapeHtml(client.phone || '—') + '</div>' +
            '<div class="detail-field"><span>Age</span>' + escapeHtml(String(client.age || '—')) + '</div>' +
            '<div class="detail-field"><span>Height</span>' + (client.height_cm ? escapeHtml(String(client.height_cm)) + ' cm' : '—') + '</div>' +
            '<div class="detail-field"><span>Starting Weight</span>' + (client.weight_kg ? escapeHtml(String(client.weight_kg)) + ' kg' : '—') + '</div>' +
            '<div class="detail-field"><span>Goal</span>' + escapeHtml(client.goal || '—') + '</div>' +
            '</div>' +
            '<div style="margin-bottom:1rem;"><div class="detail-field" style="margin-bottom:0.5rem;"><span>Assigned Programs</span>' + progsHtml + '</div>' + assignSelect + '</div>' +
            '<div><div class="detail-field" style="margin-bottom:0.5rem;"><span>Recent Progress Logs</span></div>' + logsHtml + '</div>';
    }

    // ASSIGN PROGRAM
    async function assignProgram(clientId) {
        var select    = document.getElementById('assign-select-' + clientId);
        var programId = select.value;
        if (!programId) { window.auth.toast('Select a program to assign.', 'error'); return; }

        var { error } = await window.sb.from('client_programs').upsert({ client_id: clientId, program_id: programId });

        if (error) { window.auth.toast('Could not assign program.', 'error'); return; }

        window.auth.toast('Program assigned!', 'success');
        document.getElementById('detail-' + clientId).style.display = 'none';
        toggleClientDetail(clientId);
    }

    // SEARCH
    document.getElementById('clientSearch').addEventListener('input', function () {
        var q = this.value.toLowerCase().trim();
        var filtered = allClients.filter(function (c) {
            return (c.full_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
        });
        renderClientsTable(filtered);
    });

    // PROGRAMS
    async function loadAdminPrograms() {
        var { data, error } = await window.sb
            .from('programs')
            .select('id, title, description, type, created_at')
            .order('created_at', { ascending: false });

        var wrap = document.getElementById('adminProgramsWrap');

        if (error || !data || data.length === 0) {
            wrap.innerHTML = '<div class="empty-state"><p>No programs yet. Use the Upload tab to add one.</p></div>';
            return;
        }

        var typeMap = { pdf: 'PDF Guide', video: 'Video', link: 'External Link' };

        wrap.innerHTML = data.map(function (p) {
            return '<div class="dash-card" style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">' +
                '<div>' +
                '<span class="program-type-badge">' + (typeMap[p.type] || escapeHtml(p.type)) + '</span>' +
                '<h3 style="margin-top:0.5rem;">' + escapeHtml(p.title) + '</h3>' +
                '<p>' + escapeHtml(p.description || '') + '</p>' +
                '</div>' +
                '<button class="btn btn-outline" style="padding:0.45rem 1rem; font-size:0.65rem; flex-shrink:0;" data-action="delete-program" data-program-id="' + escapeHtml(p.id) + '">Delete</button>' +
            '</div>';
        }).join('');
    }

    // DELETE PROGRAM
    async function deleteProgram(programId) {
        if (!confirm('Delete this program? This cannot be undone.')) return;

        var { error } = await window.sb.from('programs').delete().eq('id', programId);
        if (error) { window.auth.toast('Could not delete program.', 'error'); return; }

        window.auth.toast('Program deleted.', 'success');
        loadAdminPrograms();
    }

    // EVENT DELEGATION
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.dataset.action;
        if (action === 'toggle-detail') toggleClientDetail(btn.dataset.clientId);
        else if (action === 'assign-program') assignProgram(btn.dataset.clientId);
        else if (action === 'delete-program') deleteProgram(btn.dataset.programId);
    });

    // UPLOAD
    document.getElementById('prog_type').addEventListener('change', function () {
        var isFile = this.value === 'pdf' || this.value === 'video';
        document.getElementById('fileGroup').style.display = isFile ? 'block' : 'none';
        document.getElementById('linkGroup').style.display = this.value === 'link' ? 'block' : 'none';
    });

    document.getElementById('uploadForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var btn         = document.getElementById('uploadBtn');
        var title       = document.getElementById('prog_title').value.trim();
        var desc        = document.getElementById('prog_desc').value.trim();
        var type        = document.getElementById('prog_type').value;
        var fileInput   = document.getElementById('prog_file');
        var link        = document.getElementById('prog_link').value.trim();
        var clientId    = document.getElementById('assign_client').value;

        if (!title || !type) { window.auth.toast('Title and type are required.', 'error'); return; }

        btn.disabled = true;
        btn.textContent = 'Saving…';

        var session   = await window.auth.getSession();
        var creatorId = session.user.id;
        var fileUrl   = link || null;

        if ((type === 'pdf' || type === 'video') && fileInput.files[0]) {
            var file     = fileInput.files[0];
            var filePath = creatorId + '/' + Date.now() + '-' + file.name.replace(/\s+/g, '_');

            var { data: storageData, error: storageErr } = await window.sb.storage
                .from('programs')
                .upload(filePath, file, { upsert: false });

            if (storageErr) {
                window.auth.toast('File upload failed: ' + storageErr.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Save Program';
                return;
            }

            var { data: urlData } = window.sb.storage.from('programs').getPublicUrl(filePath);
            fileUrl = urlData ? urlData.publicUrl : storageData.path;
        }

        var { data: progData, error: progErr } = await window.sb.from('programs').insert({
            title:       title,
            description: desc || null,
            type:        type,
            file_url:    fileUrl,
            created_by:  creatorId
        }).select('id').single();

        if (progErr || !progData) {
            window.auth.toast('Could not save program.', 'error');
            btn.disabled = false;
            btn.textContent = 'Save Program';
            return;
        }

        if (clientId) {
            await window.sb.from('client_programs').upsert({ client_id: clientId, program_id: progData.id });
        }

        window.auth.toast('Program saved!', 'success');
        this.reset();
        document.getElementById('fileGroup').style.display = 'block';
        document.getElementById('linkGroup').style.display = 'none';
        btn.disabled = false;
        btn.textContent = 'Save Program';
        loadAdminPrograms();
    });

    // INIT
    loadClients();
    loadAdminPrograms();

})().catch(function (err) {
    console.error('Admin dashboard error:', err);
    window.auth && window.auth.toast('An error occurred. Please refresh the page.', 'error');
});

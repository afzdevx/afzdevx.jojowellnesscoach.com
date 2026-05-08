(function () {
    var SUPABASE_URL  = 'https://vxedyacxjifuozwsztvi.supabase.co';
    var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZWR5YWN4amlmdW96d3N6dHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTYwMjgsImV4cCI6MjA5MzgzMjAyOH0.Bl5IAlVCNSA1TmxBeiqOWm7IsmtSaOG7Hzjtvg_JrhQ';

    var _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    window.sb = _supabase;
})();

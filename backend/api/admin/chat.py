# backend/api/admin/chat.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils.timesince import timesince
from api.core.models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display  = ("sender_display", "recipient_display", "message_preview", "has_file", "is_read_badge", "time_ago")
    list_filter   = ("is_read", "timestamp")
    search_fields = ("sender__username", "recipient__username", "message")
    readonly_fields = ("sender", "recipient", "message", "file", "timestamp", "is_read")
    ordering      = ("-timestamp",)
    date_hierarchy = "timestamp"

    # No add permission — messages are created via the app, not the admin
    def has_add_permission(self, request):
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("sender", "recipient")

    # ── Display helpers ────────────────────────────────────────────────────────

    @admin.display(description="From", ordering="sender__username")
    def sender_display(self, obj):
        return format_html(
            '<span style="font-weight:600;color:#0d9488">{}</span>',
            obj.sender.username,
        )

    @admin.display(description="To", ordering="recipient__username")
    def recipient_display(self, obj):
        return format_html(
            '<span style="color:#4f46e5">{}</span>',
            obj.recipient.username,
        )

    @admin.display(description="Message")
    def message_preview(self, obj):
        preview = obj.message[:80] + ("…" if len(obj.message) > 80 else "")
        return format_html('<span style="color:#374151">{}</span>', preview)

    @admin.display(description="File", boolean=False)
    def has_file(self, obj):
        if obj.file:
            return format_html(
                '<a href="{}" target="_blank" style="color:#0d9488">📎 View</a>',
                obj.file.url,
            )
        return format_html('<span style="color:#d1d5db">—</span>')

    @admin.display(description="Read", ordering="is_read")
    def is_read_badge(self, obj):
        if obj.is_read:
            return format_html(
                '<span style="background:#dcfce7;color:#16a34a;padding:2px 8px;'
                'border-radius:9999px;font-size:11px;font-weight:600">Read</span>'
            )
        return format_html(
            '<span style="background:#fef9c3;color:#ca8a04;padding:2px 8px;'
            'border-radius:9999px;font-size:11px;font-weight:600">Unread</span>'
        )

    @admin.display(description="Sent", ordering="timestamp")
    def time_ago(self, obj):
        return format_html(
            '<span style="color:#9ca3af;font-size:12px">{} ago</span>',
            timesince(obj.timestamp),
        )

    # ── Actions ────────────────────────────────────────────────────────────────

    actions = ["mark_as_read", "mark_as_unread", "delete_selected"]

    @admin.action(description="Mark selected messages as read")
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f"{updated} message(s) marked as read.")

    @admin.action(description="Mark selected messages as unread")
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f"{updated} message(s) marked as unread.")
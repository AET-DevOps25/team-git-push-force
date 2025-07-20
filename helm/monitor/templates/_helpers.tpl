{{- define "monitoring.name" -}}
monitoring
{{- end }}

{{- define "monitoring.labels" -}}
app.kubernetes.io/name: {{ include "monitoring.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }} 
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from django.http import HttpResponse


def generate_course_syllabus_pdf(course):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'], fontSize=24, spaceAfter=24
    )
    story.append(Paragraph(f"Course Syllabus: {course.title}", title_style))
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph(f"<b>Department:</b> {course.get_department_display()}", styles['Normal']))
    if course.student_class:
        story.append(Paragraph(f"<b>Class:</b> {course.student_class}", styles['Normal']))
    if course.instructor and getattr(course.instructor, 'user', None):
        story.append(Paragraph(
            f"<b>Instructor:</b> {course.instructor.user.get_full_name()}", styles['Normal']
        ))
    if course.description:
        story.append(Paragraph(f"<b>Description:</b> {course.description}", styles['Normal']))
    story.append(Spacer(1, 0.2 * inch))

    assignments = course.assignments.all()
    if assignments:
        story.append(Paragraph("Assignments", styles['Heading2']))
        data = [["Title", "Deadline"]]
        for assignment in assignments:
            deadline = assignment.deadline.strftime("%Y-%m-%d %H:%M") if assignment.deadline else "N/A"
            data.append([assignment.title, deadline])
        table = Table(data, colWidths=[3.5 * inch, 2.5 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.2 * inch))

    quizzes = course.quiz_set.all()
    if quizzes:
        story.append(Paragraph("Quizzes", styles['Heading2']))
        data = [["Title", "Total Marks", "Duration (min)"]]
        for quiz in quizzes:
            duration = quiz.duration if quiz.duration is not None else "N/A"
            data.append([quiz.title, str(quiz.total_marks), str(duration)])
        table = Table(data, colWidths=[3.0 * inch, 1.5 * inch, 1.5 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)

    doc.build(story)
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="syllabus_{course.id}.pdf"'
    return response


def generate_assignment_pdf(assignment):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"Assignment: {assignment.title}", styles['Heading1']))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"<b>Course:</b> {assignment.course.title}", styles['Normal']))
    if assignment.deadline:
        story.append(Paragraph(
            f"<b>Deadline:</b> {assignment.deadline.strftime('%Y-%m-%d %H:%M')}", styles['Normal']
        ))
    if assignment.description:
        story.append(Paragraph(f"<b>Description:</b> {assignment.description}", styles['Normal']))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(
        "Instructions: Submit your work via the LMS before the deadline.", styles['Normal']
    ))

    doc.build(story)
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="assignment_{assignment.id}.pdf"'
    return response


def generate_quiz_result_pdf(submission):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Quiz Result", styles['Heading1']))
    story.append(Spacer(1, 0.2 * inch))
    student_name = getattr(submission.student.user, 'get_full_name', None)
    student_name = submission.student.user.get_full_name() if student_name else submission.student.user.username
    story.append(Paragraph(f"<b>Student:</b> {student_name}", styles['Normal']))
    story.append(Paragraph(f"<b>Quiz:</b> {submission.quiz.title}", styles['Normal']))
    story.append(Paragraph(f"<b>Course:</b> {submission.quiz.course.title}", styles['Normal']))
    story.append(Paragraph(
        f"<b>Score:</b> {submission.score or 0} / {submission.quiz.total_marks}", styles['Normal']
    ))
    story.append(Paragraph(
        f"<b>Submitted on:</b> {submission.submitted_at.strftime('%Y-%m-%d %H:%M')}", styles['Normal']
    ))
    if getattr(submission, 'feedback', None):
        story.append(Paragraph(f"<b>Feedback:</b> {submission.feedback}", styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="quiz_result_{submission.id}.pdf"'
    return response
